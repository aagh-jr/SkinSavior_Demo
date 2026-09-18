-- Apply in the Supabase SQL editor. Both changes are repeatable.
BEGIN;

-- Saved products ("My shelf").
--
-- The /saved page has always been a mock: it held its list in React state over
-- three hardcoded demo products, so saving did nothing and every refresh reset
-- it. There was no table behind it. This adds one.
--
-- Owner-scoped, mirroring skincare_routines: a user reads and writes only
-- their own rows, enforced by RLS rather than by application code.

create table if not exists public.saved_products (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  -- Free-text note: "the one that broke me out", "repurchase in March".
  note       text,
  created_at timestamptz not null default now(),
  -- Saving twice is a no-op, not a duplicate row. Also lets the app upsert
  -- without checking first.
  unique (profile_id, product_id)
);

create index if not exists saved_products_profile_id_idx
  on public.saved_products (profile_id);
create index if not exists saved_products_product_id_idx
  on public.saved_products (product_id);

alter table public.saved_products enable row level security;

drop policy if exists "saved_products_all_own" on public.saved_products;
create policy "saved_products_all_own" on public.saved_products
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);


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

COMMIT;

-- Verify after applying:
SELECT to_regclass('public.saved_products') AS saved_products;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tags';
