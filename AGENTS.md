# skinsavior — working context

Read this first. It's loaded automatically each session, so it's the memory
that survives a context reset. Keep it current: when a decision here stops
being true, change it rather than leaving both versions around.

Longer-form docs live in `docs/`; deferred ideas in `docs/ideas/`. Every
external service, API, data source and tool the project uses is catalogued in
`docs/services-and-tools.md`.

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

## File types and where they go

Every file has one job, and its name and folder say what that job is. The main
split is **visual files** (only show information) versus **data files** (get
information) — so AI design tools can edit visuals without touching data,
secrets or Supabase, and the boundary is enforced by lint, not memory.

| # | Type | Its one job | How it's labeled | Where it lives |
|---|---|---|---|---|
| 1 | Visual component | Receives props and renders. No fetching, no Supabase, no `-db` imports (type imports from `@skinsavior/core/types` are fine) | PascalCase, no suffix: `ProductThumb.tsx`. The pure half of a split component takes the `View` suffix: `SiteNavView.tsx` | `apps/web/src/components/<feature>/` |
| 2 | Data hook | Fetches/subscribes for the client and returns it (owns loading/error) | `use*`: `useAiTip.ts` | `apps/web/src/hooks/` |
| 3 | Database file | Reads/writes Supabase. No UI. `import "server-only"` at top | `*-db.ts` | `apps/web/src/lib/` |
| 4 | Page | Loads data for one screen and assembles components. Thin | `page.tsx` | `apps/web/src/app/` |
| 5 | Backend route | Server-only work needing secret keys (Gemini, Claude, admin Supabase) | `route.ts` | `apps/web/src/app/api/` |
| 6 | Engine | Pure logic: scoring, grading, matching | plain name | `packages/core/src/` |
| 7 | Types & schemas | Data shapes only | `<domain>.types.ts`; schemas stay in `packages/core/src/schemas/` | `packages/core/src/types/` |
| 8 | Design tokens | Colors, spacing, type | `tokens.ts` | `packages/ui/src/` |
| 9 | UI kit | shadcn primitives (leave as is) | — | `apps/web/src/components/ui/` |
| 10 | Tests | Check behavior | `*.test.ts` next to the file | next to the file |
| 11 | Stories & fixtures | Show visual components with fake data | `*.stories.tsx` next to the component; `<domain>.fixtures.ts` | stories next to components; fixtures in `apps/web/src/fixtures/` |
| 12 | Scripts | Offline data pipeline | grouped by job | `scripts/` (`import/`, `research/`, `seed/`, `maintenance/`) |
| 13 | Docs | Specs, policies, ideas, prompts | `.md` | `docs/` (`ideas/`, `prompts/`, `specs/`, `assets/`) |
| 14 | Analytics (future) | The only place that talks to PostHog | `analytics.ts` | `apps/web/src/lib/` (not built yet) |

**Split pattern (View suffix):** when a component both fetches and renders,
split it. The fetch/subscription moves to a `use*` hook; the pure render moves
to `<Name>View.tsx`; the original name stays as a thin wrapper that calls the
hook and renders the view, so pages don't change. Examples:
`SiteNav` = `useSession()` + `<SiteNavView />`; `AiTipCard` = `useAiTip()` +
`<AiTipCardView />`.

**Three rules, enforced by `apps/web/.eslintrc.json`:**
1. **Visual components never fetch.** No `fetch`, Supabase, `/api/` or
   `process.env` under `components/` (except `components/ui/`). A lint rule
   blocks `@supabase/*`, `@/lib/supabase/*`, `@/lib/*-db`, `@/lib/admin` and
   `@/lib/ingest` there.
2. **New data access goes in a `use*` hook (client) or a `-db.ts` module
   (server).** Never inline in a component.
3. **Every new visual component gets a `*.stories.tsx`** next to it, covering
   the states it has (default, loading, empty, error, long text).

**Design without a database:** `apps/web/src/lib/supabase/mock.ts` is the
Supabase kill switch (`NEXT_PUBLIC_SUPABASE_DISABLED=true`, wired to the
`dev:design` script) so AI design tools can run the whole app without secrets.
It's kept as a fallback; **Storybook (below) is now the preferred home for
AI-assisted design work** on individual components.

---

## Storybook

The design workshop for `apps/web`. Every visual component appears in a gallery
with realistic fake data, in all its states, with **no Supabase, no `/api/`, no
network** — so you (or an AI design tool) can view and redesign one piece at a
time without touching the real backend.

**Run it:** `bun run storybook` from `apps/web` (build: `bun run build-storybook`).
Storybook is additive and never ships to production — `next build` and the
Vercel deploy are unaffected.

**Rules (match the file-types rules above):**

1. **Every new visual component gets a `*.stories.tsx`** next to it (same folder,
   grouped by feature: `Products/…`, `Research/…`, `Routines/…`). Cover the
   states that apply: default, loading, empty, error, long text, and mobile
   (375px via `globals: { viewport: { value: "iphoneSE" } }`).
2. **New fake data goes in `apps/web/src/fixtures/`** as `<domain>.fixtures.ts`,
   typed against `@skinsavior/core/types` so it breaks loudly if a shape changes.
   Reuse the existing fixtures rather than inlining data in a story.
3. **Stories never call Supabase or `/api/`.** Pass fixtures as props for pure
   components; for a component that fetches, add per-story
   `parameters.msw.handlers` (MSW). An unhandled `/api/*` request fails with a
   loud 501 by design — that means a story forgot a handler.

**How the sandbox is enforced** (`.storybook/`): `preview.tsx` loads
`globals.css` + the three app fonts and wraps stories in the shared
`QueryClientProvider`; `main.ts` aliases `@/lib/supabase/{client,server,admin}`
to a no-op mock and forces `NEXT_PUBLIC_SUPABASE_DISABLED=true`; DB-backed
server actions (`@/app/{search,ingredients,routines,review}/actions`) are aliased
to `action-stubs.ts` so their server-only `-db` stack never enters the browser
bundle (a server action can't run in Storybook anyway). The `storybook` vitest
project smoke-tests that every story renders (`bunx vitest run --project storybook`);
`unit` is the plain vitest project for `*.test.ts`.

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
| `import_brand_catalogs.py` | Whole brand catalogues from Shopify `/products.json`. Main importer. 46 brands. |
| `fetch_popular_products.py` | Curated list; also holds shared `Db`, `scrape_incidecoder`, `preflight`. |
| `classify_catalog.py` | Flags out-of-scope rows via `excluded_reason`. Report-only unless `--write`. |
| `backfill_photos.py` | Official pack shots from INCIDecoder for products stuck on crowd photos. |
| `upgrade_obf_resolution.py` | Swaps OBF `.400.jpg` thumbnails for `.full.jpg` originals. |
| `backfill_ingredient_links.py` | Rebuilds links from stored `raw_ingredients`. No scraping. |
| `run_import.py` | Launcher: reads the service key from `apps/web/.env.local` so it never goes in a shell. |
| `cleanup_catalog.py` | DELETES channel listings/makeup/accessories. Prefer classify — it hides instead. |

**Photo identity is verified by FORMULA, not name.** `backfill_photos.py` takes
INCIDecoder's top search hit, which is best-effort — "CeraVe Moisturising
Lotion" and "…Cream" are one result apart. A wrong photo is worse than a bad
one, because a bad photo looks bad while a wrong photo looks fine. So the
fetched INCI list is compared against the stored `raw_ingredients`: ≥0.80
containment settles it alone, and below that the name must agree too. Name
alone would reject correct matches on every non-English row — Avène's "Crème
peaux intolérantes" scored formula 1.00 and name 0.00 purely because we store
the French title.

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
| An unquoted comma breaking a PostgREST filter | "this brand had no products" |
| A brand shortlist added to save lookups | "no photo exists for these" |

The last two are recent. A comma in the brand name — `Dear, Klairs` — split
the `or=(...)` filter in `find_product`, so all 44 of that brand's products
400'd and were lost; the run still printed `added: 508` and looked like a
success. And `backfill_photos.py` originally defaulted to a hand-written list
of recognisable brands, on the untested assumption that INCIDecoder wouldn't
index European supermarket own-label. Sampling that tail returned a ~27% hit
rate. **A filter added as a cost optimisation is a claim about the data, and
it needs measuring like any other.**

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
- **PostgREST splits `or=(...)` on commas and parens AFTER url-decoding.** Any
  value going into a filter list must be double-quoted — `Db._quoted()` for a
  single value, `Db._in_list()` for a list. Brand names are full of commas
  (`Dear, Klairs`, `Henkel, Diadermine`), as are INCI names (`1,2-hexanediol`).
- **Open Beauty Facts serves `.400.jpg` and `.full.jpg`** from the same path.
  The whole seed was stored at 400px, which on portrait phone shots leaves the
  short edge at ~150px — they rendered as broken rather than merely amateur.
- **Shopify `tags` are merchandising metadata, never product typing.**
  Folding them into `guess_category` put moisturizers in Sunscreens: Innisfree
  carries the gift-with-purchase tag `free mini spf w/moisturizer`, Cocokind
  carries `NO CHEMICAL SUNSCREEN` (a *negative* claim), Versed carries the
  collection `Moisturizers & SPF`. Category comes from title + `product_type`;
  tags are consulted only as a WHOLE value (`TAG_CATEGORY`), the same rule
  `BUNDLE_TAGS` already follows. **A miscategorised product is safety-adjacent
  — `/for-you` ranks within a category, so a moisturizer in Sunscreens gets
  recommended to someone shopping for sun protection.**
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

**1,975 rows · 1,739 visible · 236 hidden** (153 no ingredients, 76 makeup,
6 accessories, 1 body). 343 brands. Of the visible catalogue: **100%
scoreable** (every product has a real INCI list), **78% real product
photography** (1,215 brand studio + 147 official pack shots), 1,249 with
prices.

The remaining 377 are crowd photos (351) or nothing (24). Measured: only ~21
of those are out-of-scope products rather than a genuine photo gap, so hiding
junk will not move this number — a new source would.

Photo sources are exhausted except one. Shopify covers the 46 brands that run
it; INCIDecoder was swept across all 442 verifiable products and yielded 71,
with 266 simply not indexed and 105 rejected as different products (83 of
those scored under 0.40 formula similarity, so the guard is not the
bottleneck). **The untapped lead is that 442 of them carry an EAN barcode** —
a key into retailer sites (dm, Rossmann, Carrefour, Lidl) that carry clean
pack shots for exactly the supermarket own-label brands that are stranded.
Licensing needs checking first; that is what ruled out Olive Young.

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
- Replace the remaining Open Beauty Facts photos (~20% of visible catalogue,
  377 products) — needs the EAN/barcode route described above; Shopify and
  INCIDecoder are both exhausted
- **Ingredient descriptions are effectively empty.** Of 5,154 ingredients in
  use, 17 have a description and 1 has a common name. "Tap any ingredient ->
  what it does" is the founding idea and the emptiest part of the product
- Regenerate Supabase types to drop `as unknown as SupabaseClient` casts
- `packages/core` ESLint config is broken; repo-wide `bun run lint` fails
