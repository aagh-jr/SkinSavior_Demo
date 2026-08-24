-- Minimal schema for the skincare catalogue pipeline.
--
-- This is the CONTRACT the scripts depend on, not the full application schema
-- (the app adds profiles, routines, reviews, research and more; see
-- supabase/migrations/ for those). Anything here can be extended, but the
-- column names and the product_ingredients ordering are what the pipeline
-- reads and writes.
--
-- Apply in the Supabase SQL editor. Migrations are NOT applied by writing the
-- file — running it is a separate step, and forgetting is a common way to get
-- confusing "column does not exist" errors mid-import.

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  brand         text,
  name          text not null,
  category      text,            -- source value, e.g. 'Serum' / 'serums'
  product_type  text,
  origin        text,
  image_url     text,
  price         text,            -- text: a snapshot, not a currency amount
  description   text,

  -- The full INCI list as one ordered string, exactly as published.
  -- Kept alongside the normalised join table because it is the record of what
  -- the source actually said, and re-parsing beats re-scraping.
  raw_ingredients text,

  obf_id        text,            -- EAN barcode, for Open Beauty Facts rows
  source        text,            -- 'seed' | 'ai_extracted' | ...

  -- Why this product is hidden. NULL = visible.
  -- Out-of-scope products are FLAGGED, not deleted: the decision stays
  -- reversible, and a re-import cannot silently resurrect something already
  -- judged. Every catalogue-facing query filters on this.
  excluded_reason text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- One product per brand. The importer relies on this to enrich rather than
  -- duplicate on re-run.
  unique (brand, name)
);

alter table public.products drop constraint if exists products_excluded_reason_check;
alter table public.products add constraint products_excluded_reason_check
  check (excluded_reason is null or excluded_reason in (
    'makeup',          -- colour cosmetics
    'accessory',       -- brushes, tools, devices, merch
    'bundle',          -- several distinct products in one listing
    'body_hair',       -- body, hair, scalp, hands, feet
    'no_ingredients',  -- nothing to analyse, so nothing we can say
    'channel_listing'  -- per-retailer duplicate of a product we already have
  ));

-- Canonical category as a GENERATED column.
--
-- `category` holds whatever the source called it, and sources disagree
-- ('Sunscreen' vs 'sunscreens' vs 'spf'). Generated means it cannot drift:
-- any INSERT or UPDATE recomputes it, so ingest code and manual edits stay
-- consistent for free. Rewriting `category` in place would instead destroy
-- the source value, and 'face-creams' vs 'moisturizers' is a real distinction
-- worth keeping.
--
-- Note the lip match uses a POSIX word boundary. A LIKE '%lip_%' here treats
-- `_` as a wildcard and wrongly catches "Lipid" and "Lollipop".
alter table public.products
  add column if not exists canonical_category text
  generated always as (
    case
      when coalesce(name, '') ~* '(^|[^[:alpha:]])lip([^[:alpha:]]|$)' then 'lip_balm'
      when lower(coalesce(category, '')) in ('sunscreen', 'sunscreens', 'spf') then 'sunscreen'
      when lower(coalesce(category, '')) in ('cleanser', 'cleansers') then 'cleanser'
      when lower(coalesce(category, '')) in ('oil cleanser', 'cleansing oil', 'cleansing balm') then 'oil_cleanser'
      when lower(coalesce(category, '')) in
           ('moisturizer', 'moisturizers', 'face-creams', 'face creams', 'cream', 'balm') then 'moisturizer'
      when lower(coalesce(category, '')) in ('serum', 'serums') then 'serum'
      when lower(coalesce(category, '')) in ('essence', 'essences', 'ampoule', 'ampoules') then 'essence'
      when lower(coalesce(category, '')) in ('toner', 'toners') then 'toner'
      when lower(coalesce(category, '')) in ('exfoliant', 'exfoliants', 'peeling', 'peel') then 'exfoliant'
      when lower(coalesce(category, '')) in ('mask', 'masks') then 'mask'
      when lower(coalesce(category, '')) in ('eye cream', 'eye creams') then 'eye_cream'
      when lower(coalesce(category, '')) in ('oil', 'oils', 'face oil', 'facial oil') then 'oil'
      when lower(coalesce(category, '')) in ('mist', 'mists') then 'mist'
      else 'other'
    end
  ) stored;

-- Partial index: the common query is "visible products", and indexing only the
-- NULL case keeps it small no matter how much gets excluded.
create index if not exists products_visible_idx
  on public.products (canonical_category)
  where excluded_reason is null;

create index if not exists products_brand_idx on public.products (lower(brand));

-- ---------------------------------------------------------------------------
-- ingredients
-- ---------------------------------------------------------------------------

create table if not exists public.ingredients (
  id          uuid primary key default gen_random_uuid(),
  inci_name   text not null,
  common_name text,
  description text,

  -- Function tags scraped per ingredient. NOTE: on the reference dataset these
  -- turned out contaminated (a scraper collected every function link on the
  -- page, so caffeine came back "perfuming"). Do not use them for anything
  -- safety-bearing without checking how they were populated -- a false
  -- "contains fragrance" claim is worse than a missing one.
  functions   text[],

  created_at  timestamptz not null default now()
);

-- Case-insensitive uniqueness: sources vary the casing of the same INCI name.
create unique index if not exists ingredients_inci_lower_idx
  on public.ingredients (lower(inci_name));

-- ---------------------------------------------------------------------------
-- product_ingredients
-- ---------------------------------------------------------------------------

-- `position` is the INCI position, which is CONCENTRATION ORDER. It is real
-- signal: niacinamide at #2 is a headline active, at #24 a rounding error.
-- Use it to weight relevance -- but never to weight safety, because a trace
-- amount of a contraindicated ingredient still matters.
create table if not exists public.product_ingredients (
  product_id    uuid not null references public.products (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  position      integer not null,
  primary key (product_id, ingredient_id)
);

create index if not exists product_ingredients_product_idx
  on public.product_ingredients (product_id, position);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- The catalogue is public-read: scoring and browsing need no elevated
-- privilege, and requiring one would make the whole feature depend on a
-- service key being configured. Writes are service_role only, which is why
-- the pipeline scripts need the legacy service_role JWT.

alter table public.products            enable row level security;
alter table public.ingredients         enable row level security;
alter table public.product_ingredients enable row level security;

drop policy if exists "catalogue is public read" on public.products;
create policy "catalogue is public read"
  on public.products for select using (true);

drop policy if exists "ingredients are public read" on public.ingredients;
create policy "ingredients are public read"
  on public.ingredients for select using (true);

drop policy if exists "links are public read" on public.product_ingredients;
create policy "links are public read"
  on public.product_ingredients for select using (true);
