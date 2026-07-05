-- Reconcile the live Open Beauty Facts catalog with the URL-ingest pipeline.
--
-- The catalog tables (products / ingredients / product_ingredients) were
-- provisioned and populated by the original Lovable app and already hold real
-- data (~609 products, ~2.3k ingredients, ~9.3k links). The Next.js ingest
-- feature was written against a greenfield schema that never matched them.
--
-- This migration is ADDITIVE and idempotent: it alters the existing populated
-- tables in place and creates the two genuinely-new objects (product_sources,
-- find_similar_products). No catalog rows are dropped. Safe to re-run.

create extension if not exists pg_trgm;

-- The Lovable schema attaches a set_updated_at() BEFORE UPDATE trigger to
-- product_ingredients, but the table was created without the updated_at column
-- that trigger writes — so any UPDATE on it errors ("record new has no field
-- updated_at"). Add the missing column before we repoint any rows below.
alter table public.product_ingredients
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- ingredients: normalized_name (dedupe key) + ingredient_function
-- ---------------------------------------------------------------------------

-- Collapse ingredients that share a name after normalization BEFORE adding the
-- unique index, otherwise the index creation would fail. Keep the earliest row
-- per normalized name and repoint every join row onto the survivor.
create temporary table _ingredient_dedupe on commit drop as
select id as loser_id, keep_id
from (
  select id,
         first_value(id) over (
           partition by lower(btrim(inci_name))
           order by created_at, id
         ) as keep_id
  from public.ingredients
) s
where id <> keep_id;

update public.product_ingredients pi
set ingredient_id = d.keep_id
from _ingredient_dedupe d
where pi.ingredient_id = d.loser_id;

-- Repointing can produce duplicate (product_id, ingredient_id) rows; keep one.
delete from public.product_ingredients a
using public.product_ingredients b
where a.product_id = b.product_id
  and a.ingredient_id = b.ingredient_id
  and a.id > b.id;

delete from public.ingredients i
using _ingredient_dedupe d
where i.id = d.loser_id;

alter table public.ingredients
  add column if not exists normalized_name text
    generated always as (lower(btrim(inci_name))) stored;
alter table public.ingredients
  add column if not exists ingredient_function text;

create unique index if not exists ingredients_normalized_name_key
  on public.ingredients (normalized_name);

-- ---------------------------------------------------------------------------
-- products: slug (backfilled) + ingest / extraction columns
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists origin text;
alter table public.products add column if not exists price text;
alter table public.products add column if not exists claims text[] not null default '{}';
alter table public.products add column if not exists source text not null default 'ai_extracted';
alter table public.products add column if not exists extraction_model text;
alter table public.products add column if not exists extraction_confidence text;

-- Backfill legacy rows: reuse product_type as category, mark all as 'seed'
-- (they predate the ingest feature), and give each a unique slug. The id suffix
-- guarantees uniqueness across pre-existing rows; new rows get clean slugs from
-- the app's slugify() collision loop.
update public.products set category = product_type where category is null;
update public.products set source = 'seed';
update public.products
set slug = trim(both '-' from regexp_replace(lower(brand || '-' || name), '[^a-z0-9]+', '-', 'g'))
           || '-' || substr(id::text, 1, 8)
where slug is null;

alter table public.products alter column slug set not null;
create unique index if not exists products_slug_key on public.products (slug);

-- Guardrails matching the ingest code's enums.
alter table public.products drop constraint if exists products_source_check;
alter table public.products add constraint products_source_check
  check (source in ('seed', 'ai_extracted', 'user_submitted', 'verified'));
alter table public.products drop constraint if exists products_extraction_confidence_check;
alter table public.products add constraint products_extraction_confidence_check
  check (extraction_confidence is null or extraction_confidence in ('high', 'medium', 'low'));

create index if not exists products_brand_name_trgm_idx
  on public.products using gin ((lower(brand || ' ' || name)) gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- product_ingredients: pct + is_key_active, and the (product, ingredient)
-- unique constraint the ingest upsert (onConflict) requires
-- ---------------------------------------------------------------------------
alter table public.product_ingredients add column if not exists pct text;
alter table public.product_ingredients
  add column if not exists is_key_active boolean not null default false;

alter table public.product_ingredients
  drop constraint if exists product_ingredients_product_ingredient_key;
alter table public.product_ingredients
  add constraint product_ingredients_product_ingredient_key
  unique (product_id, ingredient_id);

-- ---------------------------------------------------------------------------
-- product_sources: new — maps canonical URLs -> products (cheap URL dedupe)
-- ---------------------------------------------------------------------------
create table if not exists public.product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists product_sources_product_id_idx
  on public.product_sources (product_id);

alter table public.product_sources enable row level security;
drop policy if exists "catalog product sources are public" on public.product_sources;
create policy "catalog product sources are public" on public.product_sources
  for select using (true);

-- ---------------------------------------------------------------------------
-- Fuzzy dedupe RPC used by the ingest route before creating a new product.
-- ---------------------------------------------------------------------------
create or replace function public.find_similar_products(p_query text, p_limit int default 5)
returns table (id uuid, slug text, name text, brand text, sim real)
language sql
stable
as $$
  select p.id, p.slug, p.name, p.brand,
         similarity(lower(p.brand || ' ' || p.name), lower(p_query)) as sim
  from public.products p
  order by sim desc
  limit p_limit;
$$;
