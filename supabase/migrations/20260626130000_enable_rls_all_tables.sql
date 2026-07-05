-- =====================================================================
-- Enable Row Level Security on every public table + add access policies.
--
-- WHY: With RLS disabled, Supabase's default grants to the `anon` and
-- `authenticated` roles leave these tables fully readable/writable through
-- the public API (PostgREST). Enabling RLS makes the default DENY, then the
-- policies below grant back exactly the access each table needs.
--
-- `service_role` (the server-side admin client) bypasses RLS entirely, so
-- seeding and admin operations are unaffected.
-- =====================================================================

-- ---------- profiles: private. Public reads go through public_profiles view ----------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- public catalog / reference: read-only to everyone ----------
alter table public.products enable row level security;
drop policy if exists "products_read_all" on public.products;
create policy "products_read_all" on public.products
  for select to anon, authenticated using (true);

alter table public.ingredients enable row level security;
drop policy if exists "ingredients_read_all" on public.ingredients;
create policy "ingredients_read_all" on public.ingredients
  for select to anon, authenticated using (true);

alter table public.ingredient_clashes enable row level security;
drop policy if exists "ingredient_clashes_read_all" on public.ingredient_clashes;
create policy "ingredient_clashes_read_all" on public.ingredient_clashes
  for select to anon, authenticated using (true);

alter table public.product_ingredients enable row level security;
drop policy if exists "product_ingredients_read_all" on public.product_ingredients;
create policy "product_ingredients_read_all" on public.product_ingredients
  for select to anon, authenticated using (true);

-- ---------- product_ratings: public read; each user writes only their own ----------
alter table public.product_ratings enable row level security;

drop policy if exists "ratings_read_all" on public.product_ratings;
create policy "ratings_read_all" on public.product_ratings
  for select to anon, authenticated using (true);

drop policy if exists "ratings_insert_own" on public.product_ratings;
create policy "ratings_insert_own" on public.product_ratings
  for insert to authenticated with check (auth.uid() = profile_id);

drop policy if exists "ratings_update_own" on public.product_ratings;
create policy "ratings_update_own" on public.product_ratings
  for update to authenticated using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

drop policy if exists "ratings_delete_own" on public.product_ratings;
create policy "ratings_delete_own" on public.product_ratings
  for delete to authenticated using (auth.uid() = profile_id);

-- ---------- skincare_routines: private to owner ----------
alter table public.skincare_routines enable row level security;
drop policy if exists "routines_all_own" on public.skincare_routines;
create policy "routines_all_own" on public.skincare_routines
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ---------- routine_steps: private; owned via the parent routine ----------
alter table public.routine_steps enable row level security;
drop policy if exists "routine_steps_all_own" on public.routine_steps;
create policy "routine_steps_all_own" on public.routine_steps
  for all to authenticated
  using (exists (
    select 1 from public.skincare_routines r
    where r.id = routine_steps.routine_id and r.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.skincare_routines r
    where r.id = routine_steps.routine_id and r.profile_id = auth.uid()
  ));

-- ---------- search_history: private to owner ----------
alter table public.search_history enable row level security;
drop policy if exists "search_history_all_own" on public.search_history;
create policy "search_history_all_own" on public.search_history
  for all to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
