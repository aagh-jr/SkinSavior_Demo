---
name: skincare-catalog-pipeline
description: >-
  Build a skincare product catalogue with real ingredient lists (INCI),
  professional product photography, prices and categories, pulled from brand
  Shopify storefronts, INCIDecoder and Open Beauty Facts into Supabase/Postgres.
  Use this whenever the task involves pulling, importing, scraping, refreshing
  or repairing cosmetics/skincare product data — product photos, ingredient
  lists, brand catalogues, INCI parsing, product categorisation — even if the
  user does not name a source. Also use it when auditing an existing catalogue
  for wrong ingredient lists, promo images, miscategorised products, or
  out-of-scope items (makeup, body, hair, tools).
---

# Skincare catalogue pipeline

Pulls skincare products into a database with four things attached: a real
ingredient list, a clean product photo, a price, and a category. Everything
here exists because one of those four kept turning out to be wrong in a way
that looked fine.

Read `references/gotchas.md` before changing any matching logic — it is the
list of traps this pipeline has already fallen into, and most of them look
like reasonable code.

## The rule that governs everything

**A failure that looks like absence hides itself.** Throttling looks like "not
indexed". A swallowed exception looks like "no ingredients". A truncated query
looks like "no such ingredient". A wrong-brand match looks like healthy data.

So every lookup here distinguishes three outcomes, never two:

| Outcome | Meaning | What to do |
|---|---|---|
| found + verified | we know this is right | store it |
| found + **failed verification** | we know this is *wrong* | discard, and say so |
| not found / request failed | **we do not know** | leave existing data alone |

Collapsing the last two is how good data gets deleted on a bad network day,
and how bad data survives a cleanup. When you add a guard, make sure the
rejection stays *visible* to the caller — a guard that returns an empty result
turns "proven wrong" into "nothing there", which is the same bug wearing a
different hat.

## Setup

**Database.** Apply `references/schema.sql`. Core tables: `products`,
`ingredients`, `product_ingredients` (join, ordered by `position`).
Catalogue tables are public-read under RLS; writes need the service role.

**Credentials.** Scripts read `SUPABASE_SERVICE_KEY` from the environment.
Rather than pasting a key into a shell every session, use the launcher:

```bash
python scripts/run_import.py <script.py> [args]
```

It reads `SUPABASE_SERVICE_ROLE_KEY` from `apps/web/.env.local` and exports it.
The key must be the **legacy JWT** service_role key — the newer `sb_secret_…`
format is rejected by PostgREST.

**Dependencies.** `requests`, and `pillow` for the image work.

## Running the pipeline

Order matters. Each stage assumes the previous one ran.

### 1. Find brands worth importing

Brands on Shopify expose their whole catalogue at a public, documented
endpoint. Probe candidates before adding them:

```bash
curl -s "https://{domain}/products.json?limit=250&page=1" | head -c 300
```

A JSON body with `"products"` means it works. Roughly half of candidate brands
do; the rest serve a custom platform. Add working ones to `BRAND_DOMAINS` and
`BRAND_NAMES` in `scripts/import_brand_catalogs.py`.

`BRAND_NAMES` is the *canonical* name, not Shopify's `vendor` field — vendor is
free text and carries cruft ("COSRX official") that breaks ingredient lookups.

### 2. Import catalogues

```bash
python scripts/run_import.py import_brand_catalogs.py --dry-run --brands cosrx,anua
python scripts/run_import.py import_brand_catalogs.py --brands cosrx,anua
```

Gets name, brand, photo, price and description from Shopify; ingredients from
INCIDecoder. Products without an ingredient list are skipped by default —
a product you cannot score is padding in an ingredient index. Expect ~40-60%
of filtered candidates to be found on INCIDecoder.

Rate-limited to ~2s per lookup with backoff. Do not run two INCIDecoder jobs
at once; the throttling that follows is indistinguishable from "not indexed"
and silently drops real products.

### 3. Classify what is out of scope

```bash
python scripts/run_import.py classify_catalog.py            # report
python scripts/run_import.py classify_catalog.py --write
```

Brand stores sell makeup, tools, merch and body products alongside skincare.
This sets `products.excluded_reason` (NULL = visible) rather than deleting, so
the decision is reversible and a re-import cannot silently resurrect a product
already judged.

It reads Shopify's `product_type`, not the title, because titles say nothing:
"Hotliner" is a lip liner, "Shiny Objects" a mascara, "The Robe" a bathrobe.

### 4. Verify the ingredient lists

```bash
python scripts/run_import.py verify_ingredients.py            # report
python scripts/run_import.py verify_ingredients.py --write
```

**Run this after any import.** INCIDecoder's search matches on product *name*
across brands, so an unguarded lookup attaches another brand's formula:

```
BYOMA      Glass Skin            ->  cuura-glass-skin
Patchology glow potion           ->  herbivore-prism-exfoliating-glow-potion
Dermalogica luminfusion          ->  novex-collagen-infusion
```

Measured at ~13% of imported products before the guard existed. This is not
cosmetic — the INCI list drives scoring, clash detection and safety rules, so
a wrong list makes all of them answer confidently about a different product.

Clears only lists it can *prove* wrong. Throttled or not-found rows are left
alone and reported.

### 5. Repair photos

Three passes, cheapest first:

```bash
python scripts/run_import.py upgrade_obf_resolution.py --write   # thumbnails -> full res
python scripts/run_import.py backfill_photos.py --write          # crowd photos -> pack shots
```

Then the vision pass, which is the only thing that catches composited promo
art — see "Auditing photos" below.

`backfill_photos.py` verifies identity by **formula, not name**: it compares
the fetched INCI list against the stored one. A wrong photo is worse than a
bad photo, because a bad photo looks bad while a wrong photo looks fine.
≥0.80 ingredient containment settles it alone; below that the name must agree
too. Name alone rejects correct matches on every non-English title.

### 6. Fix categories

```bash
python scripts/run_import.py recategorize.py            # report
python scripts/run_import.py recategorize.py --write
```

Category comes from title + `product_type`. **Never fold Shopify `tags` in as
free text** — they are merchandising metadata and they lie in both directions:
`free mini spf w/moisturizer` (a gift promo) and `NO CHEMICAL SUNSCREEN` (a
claim the product contains none) both put moisturizers into Sunscreens. Tags
are trusted only as a whole value, via `TAG_CATEGORY`.

Miscategorisation is safety-adjacent when the app ranks within a category:
someone shopping for sun protection gets shown something that offers none.

## Auditing photos with a vision pass

Filename rules provably cannot detect a composited "FREE GIFT" badge, a
before/after face, or a model shot — those files are named
`anua-us-moisturizer-pdrn-hyaluronic-acid-100-moisturizing-cream.jpg` like
everything else. Looking at the pixels is the only thing that works.

Build contact sheets and review them:

```bash
python scripts/build_contact_sheets.py --out sheets/
```

40 images per sheet with index labels; ~30 sheets per 1,200 products. Read
each sheet and note the indices that are not clean pack shots. `index.json`
maps index → product.

What to flag, from experience:

- models or hands holding the product; spa/treatment photos with no product
- before/after faces, ingredient infographics, benefit callout annotations
- discount badges (`30% OFF`), retailer badges (`amazon #1`, `TikTok Shop`)
- award seals composited onto the shot
- multi-product lineups and size-comparison composites
- texture swatches with no product visible

Brand art direction is **not** a defect — a serum photographed on fruit or a
coloured ground is fine if the product is clearly visible.

Then re-source flagged products through `backfill_photos.py --ids <ids>`,
which overrides the needs-a-photo test. **Verify the replacements visually
before applying.** A batch that all scores 0.93-1.00 on formula can still be
wrong if the stored formula was itself corrupt.

## Working practices that keep paying off

**Report before write.** Every destructive or bulk script defaults to a report
and needs `--write`. The report has caught makeup-remover cleansers about to
be flagged as makeup, and a soap "- Bag" about to be flagged as an accessory.

**Measure before optimising.** A filter added to save time is a claim about the
data. One here restricted lookups to "recognisable brands" on the assumption
the long tail was not indexed; sampling that tail found a 27% hit rate and the
shortcut was discarding ~80 real photos.

**Do not tune on one example.** A "filename resembles the product title" rule
fixed the case it was written for and regressed 235 others — brands name
texture swatches and two-packs after the product too. Test any heuristic
across the whole catalogue before applying it.

**Never bare-except around a call whose failure resembles no-data.** A renamed
method threw `AttributeError` inside a swallowing `try`, and 60% of the
catalogue silently became unscoreable while every page looked healthy.

## Reference files

- `references/gotchas.md` — the specific traps: PostgREST limits and filter
  syntax, regex word-boundary failures, image URL patterns, throttling.
  **Read this before touching matching or query code.**
- `references/schema.sql` — tables, constraints, RLS policies, indexes.
- `references/sources.md` — what each source provides, what it does not, and
  the licensing position for each.
