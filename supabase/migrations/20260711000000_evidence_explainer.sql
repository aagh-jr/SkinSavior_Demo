-- Evidence Explainer: per-claim evidence grading.
--
-- Three distinct objects (files/ Evidence Explainer spec section 5):
--   studies  — one research paper, classified by CEBM design level. Raw input.
--   claims   — an ingredient-benefit pair. Receives a computed certainty grade.
--   claim_studies — many-to-many: one study can back several claims.
--
-- The grade is DERIVED, never hand-set: `certainty`, `certainty_reasons` and
-- `computed_at` on `claims` are written ONLY by the deterministic grading
-- service (packages/core/src/research/grading-db.ts). Ingestion, the runtime
-- LLM, and humans never write those columns. A column-guard trigger is future
-- hardening — impractical while a single service role does all writes.
--
-- Additive only; no existing tables are modified. Postgres enums are avoided in
-- favour of text + check constraints, matching the rest of the schema.

-- One research paper. An LLM (later) or a human extracts these fields; grading
-- reads design_level, sample_size, conflict_flag, effect_direction and the
-- indirectness signals (concentration/vehicle/outcome_measured).
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  paper_ref text not null,                       -- DOI or PMID
  title text not null,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  design_level text not null
    check (design_level in ('1', '2', '3', '4', '5')),  -- CEBM 2011 flat scale
  sample_size int,                               -- null if not stated
  duration_weeks int,
  population text,
  concentration text,                            -- as tested (indirectness signal)
  vehicle text,                                  -- formulation context
  outcome_measured text,                         -- biomarker vs visible outcome
  effect_direction text
    check (effect_direction in ('positive', 'null', 'negative')),
  effect_size text,                              -- as reported
  funding_source text,
  conflict_flag boolean not null default false,  -- industry-funded / COI
  extraction_confidence text
    check (extraction_confidence in ('high', 'low')),
  verified_by text,                              -- null until human-checked
  ingested_at timestamptz not null default now(),
  unique (ingredient_id, paper_ref)              -- natural key for idempotent upserts
);

create index if not exists studies_ingredient_id_idx
  on public.studies (ingredient_id);

-- An ingredient-benefit pair with a computed certainty grade.
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  claim_text text not null,                      -- consumer-facing benefit phrasing
  claim_type text not null default 'cosmetic'
    check (claim_type in ('cosmetic', 'borderline', 'prohibited')),
  -- Computed by the grading service. Null = not yet graded.
  certainty text
    check (certainty in ('strong', 'moderate', 'limited', 'very_limited')),
  certainty_reasons jsonb,                       -- [{code, direction, text}] from grading
  study_count int not null default 0,            -- denormalized for list UI
  computed_at timestamptz,
  unique (ingredient_id, claim_text)             -- natural key for idempotent upserts
);

create index if not exists claims_ingredient_id_idx
  on public.claims (ingredient_id);

-- Many-to-many. One study supports several claims; one claim has many studies.
create table if not exists public.claim_studies (
  claim_id uuid not null references public.claims (id) on delete cascade,
  study_id uuid not null references public.studies (id) on delete cascade,
  primary key (claim_id, study_id)
);

create index if not exists claim_studies_study_id_idx
  on public.claim_studies (study_id);

-- Public read (not user-specific); all writes go through the server via the
-- service role, which bypasses RLS — so no insert/update/delete policies.
alter table public.studies enable row level security;
drop policy if exists "studies_read_all" on public.studies;
create policy "studies_read_all" on public.studies
  for select using (true);

alter table public.claims enable row level security;
drop policy if exists "claims_read_all" on public.claims;
create policy "claims_read_all" on public.claims
  for select using (true);

alter table public.claim_studies enable row level security;
drop policy if exists "claim_studies_read_all" on public.claim_studies;
create policy "claim_studies_read_all" on public.claim_studies
  for select using (true);
