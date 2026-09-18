# Pre-launch audit remediation

Status: local working changes, not deployed. Based on the September 7 audit
at 954f975, checked against local 2e671e5 and the live Supabase REST API.

## Release gates still open

1. **B7 — database migrations.** Live read-only checks returned 404 for
   `saved_products` and 400 for `products.tags`; visible product count is 1,722.
   Apply `supabase/launch-audit-migrations.sql` in the SQL editor, verify both
   objects, run `scripts/derive_tags.ts` in report mode, then populate tags.
   Verify saving, removing a save, and owner isolation using test accounts.
2. **L4 — rate-limit configuration.** Code now fails closed, but Upstash still
   needs provisioning/configuration before paid AI features can work.
3. **Release verification.** Finish authenticated browser checks, including quiz
   save failure/retry, interrupted searches, hidden-product URLs, and safety
   read failures. Changes have not been committed, pushed, or deployed.
   GitHub fetch was attempted but has not completed; `gh` is not authenticated.

## Implemented locally

- B2–B4: removed runtime fictional products; product lookup and related rail
  query Supabase; nav searches only the database.
- B1: removed the fictional COSRX product snapshot and its fabricated match,
  safety, and evidence claims; landing metadata and copy now describe live
  ingredient, evidence, and routine-check capabilities.
- B5–B6: visibility filters in lookup/search; full paginated category counts.
- H1: shared pagination throws on failed/missing pages; safety/profile reads
  reject errors; incomplete ingredient joins do not produce a clash all-clear.
- H2: removed fabricated SPF history. H3: database ingredient typeahead.
- H4: explorer error states, cleared loading flags, retry controls.
- H5: quiz persistence error/retry and routine-seeding failure fallback.
- M1: signed-out home redirect. M2: removed contaminated function chips/filter.
- M3: community route returns not found. M4: removed “Top rated”.
- M5: removed public-profile stub cards, preserving private profile boundaries.
- M6: deleted loading and greeting routes; signup/verify has no active internal
  navigation found (remaining reference is a historical comment).
- L1: category products paginated. L2: shared query sanitizer. L3: shaped
  extraction-provider failure. L4: fail-closed missing/failed limiter.
- Architecture 1: mock clients require explicit offline flag; missing credentials
  throw. Login checks for a session. Public shared-account demo login removed.
- Architecture 2: shared pagination in core/query used across catalogue,
  match, compatibility, and brand reads; regression tests added.
- Architecture 6: public research endpoint reads cached papers only; no external
  fetch or service-role write is triggered by visitors.
- Removed the unsupported product-page match panel, search match badges, and
  profile verdicts derived from generic product tags. The ingredient spotlight
  now identifies ingredients and their printed order without inventing a
  viewer-specific conclusion.
- Removed the hardcoded San Jose UV card and its unused UV endpoint, corrected
  the settings page's unselected skin-type state, and added an accessible name
  to the bulk-add URL field.
- A1, A3, and A4 are implemented. A5 was reviewed: evidence strength has a
  visible text label and an `aria-label` with the named tier and notch count,
  so color is supplemental. The hover-only blocked-product badge from A2 is
  absent with the removed search match badges.

## Remaining structural work

- Architecture 3: finish consistent read-error handling across the data layer;
  the current pass concentrates on safety reads and saved-product failures.
- Architecture 4: regenerate database types after migrations, remove untyped
  Supabase casts and duplicate handwritten row types.
- Architecture 5: migrate remaining reusable query contracts for mobile and
  remove mobile's six hardcoded graded ingredients and fabricated homepage stats.
- Architecture 7: consolidate duplicate debounced searches into a shared hook.
  Query sanitization is already shared.
- Refresh AGENTS/CLAUDE catalogue-state documentation from verified live counts;
  do not carry forward old photo/count breakdowns without remeasurement.

## Validation notes

A fresh-dependency run passed 108 core tests, eight web regression tests,
`tsc --noEmit`, and the full Next.js production build against the configured
catalogue. Desktop and 390px browser checks passed for the revised landing
page. The build still reports Firecrawl's undeclared `undici` import as a
warning; it does not fail compilation or page generation. Original
node_modules contains cloud-only files that cause read timeouts, so validation
uses a temporary copy with fresh dependencies; it does not replace the
repository lockfile or installed dependencies.

Live local route checks returned HTTP 200 with stable JSON envelopes for both
search contracts: product results expose `id`, `slug`, `name`, `brand`,
`category`, and `imageUrl`; ingredient results expose `id` and `name`.
