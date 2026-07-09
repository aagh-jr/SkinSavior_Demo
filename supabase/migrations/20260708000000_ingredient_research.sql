-- Ingredient research: cached top-5 PubMed papers per ingredient.
--
-- Pilot scope: only a curated allowlist of the most-researched skincare
-- ingredients gets fetched (enforced in app code, not here). Tables follow
-- files/ingredient-research-spec.md section 4. Additive only; no existing
-- tables are modified.

create table if not exists public.research_papers (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  pmid text not null,
  title text not null,
  abstract text,
  journal text,
  year int,
  publication_types text[] not null default '{}',
  doi text,
  pubmed_url text not null,
  rank int not null check (rank between 1 and 5),
  fetched_at timestamptz not null default now(),
  unique (ingredient_id, pmid)
);

create index if not exists research_papers_ingredient_id_idx
  on public.research_papers (ingredient_id);

-- Caches the fetch outcome per ingredient — including the empty case, so an
-- ingredient with no PubMed results doesn't refetch on every page view.
create table if not exists public.ingredient_research_meta (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  last_fetched_at timestamptz not null default now(),
  paper_count int not null default 0,
  status text not null default 'ok' check (status in ('ok', 'empty', 'error'))
);

-- Public read (not user-specific); writes only from the server via the
-- service role, which bypasses RLS — so no insert/update policies.
alter table public.research_papers enable row level security;
drop policy if exists "research_papers_read_all" on public.research_papers;
create policy "research_papers_read_all" on public.research_papers
  for select using (true);

alter table public.ingredient_research_meta enable row level security;
drop policy if exists "ingredient_research_meta_read_all" on public.ingredient_research_meta;
create policy "ingredient_research_meta_read_all" on public.ingredient_research_meta
  for select using (true);
