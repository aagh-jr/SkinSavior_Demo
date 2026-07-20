-- Stage-3 runtime explainer: LLM-written prose per claim (Evidence Explainer
-- spec section 8, docs/claims-policy.md "Runtime" stage).
--
-- Append-only by design: every generation is inserted — including ones that
-- FAILED the disallowed-phrase filter — so the table is simultaneously the
-- render cache and the audit log the policy requires. The read layer surfaces
-- only the newest row per claim with filter_ok = true that is fresher than the
-- claim's computed_at (a regrade stales its prose). Nothing here is ever
-- written by hand, and the explainer never touches claims.certainty — the
-- grade stays derived by code only.

create table if not exists public.claim_explainers (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  model text not null,                          -- e.g. 'gemini-2.5-flash-lite'
  text text not null,                           -- the generated prose, verbatim
  filter_ok boolean not null,                   -- passed the disallowed-phrase filter
  filter_violations jsonb,                      -- [{code, match}] when it failed
  created_at timestamptz not null default now()
);

create index if not exists claim_explainers_claim_id_idx
  on public.claim_explainers (claim_id, created_at desc);

-- Public read like the rest of the evidence tables; all writes go through the
-- service role (generation script), which bypasses RLS.
alter table public.claim_explainers enable row level security;
drop policy if exists "claim_explainers_read_all" on public.claim_explainers;
create policy "claim_explainers_read_all" on public.claim_explainers
  for select using (true);
