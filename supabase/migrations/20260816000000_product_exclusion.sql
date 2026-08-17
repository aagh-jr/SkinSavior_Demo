-- Hide out-of-scope products instead of deleting them.
--
-- The catalogue accumulated makeup, tools, merch, bundles and body/hair
-- products from brand storefronts that sell them alongside skincare. Deleting
-- was the first instinct, but flagging is better: it's reversible, it keeps
-- the row so a re-import doesn't silently resurrect it, and it lets the
-- decision be revisited without re-scraping.
--
-- NULL means visible. Every catalogue-facing query filters on this.

alter table public.products
  add column if not exists excluded_reason text;

alter table public.products drop constraint if exists products_excluded_reason_check;
alter table public.products add constraint products_excluded_reason_check
  check (excluded_reason is null or excluded_reason in (
    'makeup',          -- colour cosmetics: concealer, mascara, lip colour
    'accessory',       -- brushes, spatulas, headbands, merch
    'bundle',          -- several distinct products under one listing
    'body_hair',       -- body, hair, deodorant — out of scope for a face index
    'no_ingredients',  -- nothing to analyse, so nothing we can say about it
    'channel_listing'  -- per-retailer duplicate of a product we already have
  ));

comment on column public.products.excluded_reason is
  'Why this product is hidden from the catalogue. NULL = visible. Set by
   scripts/classify_catalog.py; queries filter on it rather than deleting so
   the decision stays reversible.';

-- Partial index: the common query is "visible products", and a partial index
-- over the NULL case stays small regardless of how much gets excluded.
create index if not exists products_visible_idx
  on public.products (canonical_category)
  where excluded_reason is null;
