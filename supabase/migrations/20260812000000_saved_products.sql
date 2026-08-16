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
