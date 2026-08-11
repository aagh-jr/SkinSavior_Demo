-- Normalize product categories so per-category ranking is possible.
--
-- `products.category` holds two naming schemes that never got reconciled:
--   Open Beauty Facts seed rows  -> lowercase plural ('sunscreens', 'cleansers')
--   curated/ingested rows        -> title singular ('Sunscreen', 'Cleanser')
-- 21 distinct values across 732 products. Ranking "best serums for you" today
-- matches only the 23 rows spelled 'Serum' and silently misses the rest.
--
-- Rather than rewriting `category` (which would destroy the source value —
-- 'face-creams' vs 'moisturizers' is a real distinction worth keeping), this
-- adds a GENERATED column holding the canonical value. Generated means it
-- cannot drift: any future INSERT or UPDATE recomputes it, so ingest code and
-- manual edits stay consistent for free.
--
-- The vocabulary matches ROUTINE_CATEGORIES in
-- apps/web/src/lib/routine-categories.ts. Keep the two in sync — the TS
-- coarseToCanonical() covers the same mappings for values computed app-side.

alter table public.products
  add column if not exists canonical_category text
  generated always as (
    case
      -- Lip products first: 'Balm' covers both lip balms and body/face
      -- occlusives, so the name is the only thing that separates them.
      when lower(coalesce(name, '')) like '%lip %'
        or lower(coalesce(name, '')) like '%lip_%'
        or lower(coalesce(name, '')) like 'lip %'
        then 'lip_balm'

      when lower(coalesce(category, '')) in ('sunscreen', 'sunscreens', 'spf')
        then 'sunscreen'
      when lower(coalesce(category, '')) in ('cleanser', 'cleansers')
        then 'cleanser'
      when lower(coalesce(category, '')) in ('oil cleanser', 'cleansing oil', 'cleansing balm')
        then 'oil_cleanser'
      when lower(coalesce(category, '')) in
           ('moisturizer', 'moisturizers', 'face-creams', 'face creams', 'cream', 'balm')
        then 'moisturizer'
      when lower(coalesce(category, '')) in ('serum', 'serums')
        then 'serum'
      when lower(coalesce(category, '')) in ('essence', 'essences', 'ampoule', 'ampoules')
        then 'essence'
      when lower(coalesce(category, '')) in ('toner', 'toners')
        then 'toner'
      when lower(coalesce(category, '')) in ('exfoliant', 'exfoliants', 'peeling', 'peel')
        then 'exfoliant'
      when lower(coalesce(category, '')) in ('mask', 'masks', 'face-masks', 'face masks')
        then 'mask'
      when lower(coalesce(category, '')) in ('eye cream', 'eye-cream', 'eye creams')
        then 'eye_cream'
      when lower(coalesce(category, '')) in ('treatment', 'treatments', 'spot treatment')
        then 'spot_treatment'
      when lower(coalesce(category, '')) in ('oil', 'oils', 'face oil')
        then 'face_oil'
      else 'other'
    end
  ) stored;

comment on column public.products.canonical_category is
  'Normalized category from the ROUTINE_CATEGORIES vocabulary. Generated from
   `category` (plus a lip-product name check), so it cannot drift. `category`
   keeps the original source value.';

create index if not exists products_canonical_category_idx
  on public.products (canonical_category);
