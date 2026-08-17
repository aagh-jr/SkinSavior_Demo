# skinsavior — working context

Read this first. It's loaded automatically each session, so it's the memory
that survives a context reset. Keep it current: when a decision here stops
being true, change it rather than leaving both versions around.

Longer-form docs live in `docs/`; deferred ideas in `Ideas for later.md`.

---

## What this is

A skincare **ingredient transparency index** — Fragrantica for cosmetics.
Products, their full INCI lists, what each ingredient does, and what clashes
with what.

### Product principles (these drive technical decisions)

1. **Show your work.** Never a bare number or verdict. A user tapping "why
   91?" gets the actual arithmetic, and gets the same answer twice. This is
   why scoring is deterministic rather than model-generated.
2. **No fearmongering.** Wrongly-feared combinations get corrected as loudly
   as real ones are flagged — see `DEBUNKED_PAIRS` (niacinamide + vitamin C is
   not a clash). A checker that only ever warns teaches people to fear their
   own shelf.
3. **Science-backed, not influencer opinion.** Every claim carries an evidence
   tier so documented pharmacology is distinguishable from folklore.
4. **Professional product photography only.** Crowd-sourced phone photos are a
   placeholder to be replaced, never an acceptable end state.

---

## Architecture

Bun + Turborepo monorepo: `apps/web` (Next.js 15), `apps/mobile` (Expo),
`packages/core` (shared domain logic), `packages/ui`, `supabase/` (migrations),
`scripts/` (Python data pipeline).

### The rule that shapes everything: deterministic core, LLM at the edges

The LLM **must never change a score or invent a safety claim.** It explains
what deterministic code decided.

```
quiz answers + routine
        ↓
DETERMINISTIC   hard exclusions · weighted scoring · clash lookup
        ↓       (pure, tested, same input → same output)
LLM (optional)  turns reasons into prose. Cannot alter the score.
```

Where the model *is* the right tool: **build time, not runtime.** Use it
offline to draft data (interaction pairs, image selection), have a human
review, store the result. Runtime stays a table lookup.

### Key modules

| Path | Role |
|---|---|
| `packages/core/src/scoring/actives.ts` | INCI → active-group taxonomy. Safety-critical. |
| `packages/core/src/scoring/match.ts` | Match scoring. Pure. 23 tests. |
| `packages/core/src/scoring/interactions.ts` | Clash + usage rules. Pure. 15 tests. |
| `packages/core/src/research/grading.ts` | Evidence grading (pre-existing, same pattern). |
| `apps/web/src/lib/match-db.ts` | Wires scoring to Supabase. No logic. |
| `apps/web/src/lib/compatibility-db.ts` | Wires clash engine to Supabase. |

**Convention:** engines are pure and live in `packages/core`; `*-db.ts` in
`apps/web/src/lib` does the I/O. Never mix them.

---

## Non-obvious decisions (don't undo these without reason)

**Ingredient matching is by curated name, NOT `ingredients.functions`.** Only
~30% of ingredients have function tags, and the tags are contaminated — the
original enrichment scraper collected every function link on each INCIDecoder
page, so caffeine came back tagged "perfuming" and salicylic acid "soothing".
A false "contains fragrance" claim is worse than a missed one. Cleaning that
column is outstanding work.

**Safety is a separate field from rank.** `blocked` is not a large score
penalty. Sinking a pregnancy-unsafe retinoid to the bottom of a list hides it
from recommendations but leaves someone arriving via search or a shared link
with no warning. Callers must surface `blockReasons` wherever a product
renders.

**INCI position weights the signal, but never safety.** Order is concentration
order: niacinamide at #2 is a headline active, at #24 a rounding error. A
*trace* retinoid still matters to someone pregnant, so blocks ignore position.

**Scores are computed per request, never stored.** They're a function of the
viewer's profile — a column would be wrong for everyone but its author.

**"Prefer not to say" is not "yes."** Declining to disclose pregnancy must not
trigger warnings.

**The interaction knowledge base is code, not a table.** `actives.ts` already
groups ingredients, so rules are declared between *groups* and no vector
search is needed. `docs/ai-pipeline.md` proposes a pgvector table; that
predates the grouping and is no longer necessary.

---

## Data pipeline (`scripts/`, Python)

| Script | Does |
|---|---|
| `import_brand_catalogs.py` | Whole brand catalogues from Shopify `/products.json`. Main importer. |
| `fetch_popular_products.py` | Curated list; also holds shared `Db`, `scrape_incidecoder`, `preflight`. |
| `classify_catalog.py` | Flags out-of-scope rows via `excluded_reason`. Report-only unless `--write`. |
| `backfill_ingredient_links.py` | Rebuilds links from stored `raw_ingredients`. No scraping. |
| `cleanup_catalog.py` | DELETES channel listings/makeup/accessories. Prefer classify — it hides instead. |

**Out-of-scope products are HIDDEN, not deleted.** `products.excluded_reason`
(NULL = visible) is set by `classify_catalog.py` and filtered by every
catalogue query. Reversible, and a re-import can't silently resurrect a
product that was already judged.

Classification reads Shopify `product_type`, not the title — titles say
nothing ("Hotliner" is a lip liner, "Shiny Objects" a mascara, "Face
Perfector" a brush). `CLASSIFY_ONLY_DOMAINS` covers brands we no longer import
but still hold products from (Kosas), which would otherwise be unclassifiable.

**Sources and what each is good for:**
- **Brand Shopify storefronts** — `/products.json` is public and documented.
  Studio photography, prices, descriptions. The preferred source.
- **INCIDecoder** — ingredient lists. Throttles; see gotchas.
- **Open Beauty Facts** — the original seed. Crowd-sourced phone photos;
  being replaced.
- **Olive Young** — blocked entirely (bot protection) and imagery is
  copyrighted. Not available. Brands publish the same shots themselves.

Writes need `SUPABASE_SERVICE_KEY` (service_role, **legacy JWT** — the
`sb_secret_…` format is rejected). RLS makes catalogue tables read-only for
anon.

---

## The failure mode that keeps recurring

**A failure that looks like absence hides itself — and here, absence means
safe.** Four separate bugs, all this shape, each one silently removing
protection while every page still looked fine:

| What failed | What it looked like |
|---|---|
| INCIDecoder throttling | "product not indexed" |
| Swallowed `AttributeError` on a renamed method | "product has no ingredients" |
| PostgREST truncating at 1000 rows | "product has no such ingredient" |
| A cached page render | "this product was never blocked" |

The last two were the worst: ingredients are stored in INCI (concentration)
order, so truncation always kept the base and dropped the tail — exactly where
fragrance, essential oils and preservatives sit. Products came back looking
clean because the disqualifying ingredient was never loaded. On serums alone
that was 38 products recommended to a user who had declared a reaction to
what was in them.

The defence is to make **"we don't know" a distinct state from "there is
nothing there"** — `_fetch_failed` for the scraper, checking page length for
truncation, never bare-`except` around a call whose failure resembles no-data.

## Other gotchas that have cost time

- **PostgREST caps every response at 1000 rows.** Anything reading a whole
  category or the whole catalogue must paginate with `.range()`. Fixed in
  `match-db`, `brands-db`, `compatibility-db`.
- **Never cache a page that renders a safety block.** `/for-you` and the
  product page are `force-dynamic`. A safety exclusion a cache can hide is not
  an exclusion.
- **Word-boundary regexes.** `\bspf\b` does not match `SPF50+`;
  `\bsunscreen\b` does not match the `Sunscreens` tag; `\boil\b` matches the
  "Oil" in "Oil Free"; SQL `LIKE '%lip_%'` treats `_` as a wildcard and caught
  "Lipid" and "Lollipop". Test patterns against real catalogue values.
- **Escaping through heredocs corrupts regexes.** A pattern once contained a
  literal backspace (0x08) where `\b` was intended, so it matched nothing —
  and 0x08 renders invisibly, so the source looked correct. Edit regex lines
  directly rather than patching them through nested shell/Python strings.
- **Shopify `vendor` is free text** — "COSRX official" broke ingredient
  lookups. Use `BRAND_NAMES`.
- **Shopify `images[0]` is often a promo graphic**, not the product. Some have
  a "FREE GIFT" badge composited in, which filename rules cannot detect.
- **Windows ephemeral ports.** Per-request connections exhaust them
  (WinError 10048). Use a pooled `requests.Session`.
- **`supabaseAdmin` silently returns a mock** when `SUPABASE_SERVICE_ROLE_KEY`
  is unset — no error, just empty data and 404s everywhere.
- **Migrations are applied by hand** in the Supabase SQL editor. Writing the
  file does not apply it. Same for classification: `--write` is required.
- **Run destructive/bulk scripts as a REPORT first.** The report caught
  makeup-remover cleansers about to be flagged as makeup, and "Detox Soap -
  Bag" about to be flagged as an accessory.

---

## State

**1,422 rows · 1,215 visible · 207 hidden** (153 no ingredients, 49 makeup,
4 accessories, 1 body). Of the visible catalogue: **100% scoreable** (every
product has a real INCI list), **57% studio photography**, 693 with prices.

Started the day at 40% scoreable and 5% studio photography.

**Built:** 13-question quiz (4 skin axes + safety fields) → seeded routine
builder · deterministic match scoring with visible reasoning · `/for-you`
ranking · routine clash detection incl. retinoid/SPF timing · My shelf
(routines, products in use, saved) · A-Z brand index · brand-catalogue
importer + classification pipeline.

**Open, roughly by value:**
- **Vercel is not deploying** — the live site runs old code, so none of this
  is visible to anyone but a local dev. Diagnose before building more.
- Price comparison from affiliate feeds (Rakuten/CJ/Impact). Current prices
  are a brand-site snapshot with no timestamp and no "best price" claim.
- Vision pass or manual override for promo-overlay images (the "FREE GIFT"
  badge case) — filename rules provably cannot catch these.
- Clean the contaminated `ingredients.functions` column
- Home page, `/saved` and nav search still read a 3-product static demo file
- Derived product attributes (fragrance-free, alcohol-free) from INCI lists
- Replace the remaining Open Beauty Facts photos (~43% of visible catalogue)
- Regenerate Supabase types to drop `as unknown as SupabaseClient` casts
- `packages/core` ESLint config is broken; repo-wide `bun run lint` fails
