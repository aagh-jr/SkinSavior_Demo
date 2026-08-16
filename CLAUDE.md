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
| `cleanup_catalog.py` | Removes channel listings, makeup, accessories. List-only unless `--delete`. |

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

## Gotchas that have already cost time

- **Word-boundary regexes.** `\bspf\b` does not match `SPF50+`;
  `\bsunscreen\b` does not match the `Sunscreens` tag; SQL `LIKE '%lip_%'`
  treats `_` as a wildcard and matched "Lipid" and "Lollipop". Always test
  patterns against real catalogue values.
- **INCIDecoder throttles.** A refused request looked identical to "product
  not indexed", silently dropping valid products. `_fetch_failed` now
  distinguishes them; never conflate the two.
- **Shopify `vendor` is free text** — "COSRX official" broke ingredient
  lookups. Use `BRAND_NAMES`.
- **Shopify `images[0]` is often a promo graphic**, not the product. Some have
  a "FREE GIFT" badge composited in, which filename rules cannot detect.
- **Windows ephemeral ports.** Per-request connections exhaust them
  (WinError 10048). Use a pooled `requests.Session`.
- **`supabaseAdmin` silently returns a mock** when `SUPABASE_SERVICE_ROLE_KEY`
  is unset — no error, just empty data and 404s everywhere.
- **Migrations are applied by hand** in the Supabase SQL editor. Writing the
  file does not apply it.

---

## State

~1,420 products, ~3,000 ingredients. Roughly 25% have studio photography;
the rest are Open Beauty Facts phone photos awaiting replacement.

**Built:** 13-question quiz (4 skin axes + safety fields) → seeded routine
builder · deterministic match scoring with visible reasoning · `/for-you`
ranking · routine clash detection incl. retinoid/SPF timing · My shelf
(routines, products in use, saved) · brand-catalogue importer.

**Open:**
- Rebuild catalogue from brand sources; prune the Open Beauty Facts tail
- Clean the contaminated `ingredients.functions` column
- ~118 products in `canonical_category = "other"` (partly fixed; needs re-import)
- Vision pass or manual override for promo-overlay images
- Derived product attributes (fragrance-free, alcohol-free) from INCI lists
- Home page, `/saved` and nav search still read a 3-product static demo file
- Regenerate Supabase types to drop `as unknown as SupabaseClient` casts
- `packages/core` ESLint config is broken; repo-wide `bun run lint` fails
- Vercel is not deploying — the live site runs old code
