-- Derived product tags, for browsing and filtering.
--
-- Computed from products.raw_ingredients by scripts/derive_tags.ts, NOT copied
-- from the brand's own Shopify tags. Brand tags are marketing metadata in each
-- brand's private vocabulary, and they lie in both directions: a promo tag
-- 'free mini spf w/moisturizer' and a negative claim 'NO CHEMICAL SUNSCREEN'
-- both read as "this is a sunscreen" to anything matching on substrings.
--
-- The INCI list is a regulated disclosure we already store and have verified,
-- so a tag derived from it is something the product page can show its work for.
--
-- NULL vs '{}' matters: NULL means "we have not computed tags for this product"
-- (no INCI list), while an empty array would claim we looked and found nothing.
-- A product with no ingredients must never render as fragrance-free.

alter table public.products
  add column if not exists tags text[];

comment on column public.products.tags is
  'Derived from raw_ingredients by scripts/derive_tags.ts. NULL = not computed
   (no ingredient list). Never populated from brand marketing tags.';

-- GIN supports the containment queries the filters need:
--   where tags @> array['fragrance-free']
create index if not exists products_tags_idx
  on public.products using gin (tags);
