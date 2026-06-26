-- Public-profile read path: expose ONLY safe columns to anonymous visitors.
--
-- WHY THIS EXISTS
--   The app serves public profile pages at /user/[username], which must be
--   readable by signed-out visitors. The base `public.profiles` table also
--   holds sensitive personal data (skin-quiz answers, sensitivity, age range,
--   pregnancy_safe, etc.).
--
--   PostgreSQL RLS is ROW-level only — it cannot hide individual columns. So
--   granting the anonymous role direct read on `profiles` would expose every
--   column of every user through the public anon key + PostgREST
--   (e.g. `GET /rest/v1/profiles?select=*`).
--
--   Fix: keep `profiles` locked down (authenticated users read only their own
--   row; anon gets nothing) and publish a curated, column-limited VIEW that
--   anyone may read. The view is the ONLY public window into profiles.

-- 1. Ensure the columns the public view needs exist. No-ops on the live DB;
--    keeps a fresh setup built purely from migrations self-consistent.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;

-- 2. Curated public view — SAFE COLUMNS ONLY.
--    security_invoker is intentionally OFF: the view runs as its owner and
--    returns these columns for ALL profiles to anyone (public profiles are
--    public by design). Because the column list is fixed here, the sensitive
--    columns on `profiles` can never leak through this view. (This is the
--    deliberate trade-off behind Supabase's "security definer view" linter
--    notice — acceptable precisely because the projection is curated.)
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = false) as
  select
    display_name,
    username,
    skin_type,
    bio,
    avatar_url
  from public.profiles;

-- 3. Anyone may READ the curated view; no one writes through it.
grant select on public.public_profiles to anon, authenticated;
revoke insert, update, delete on public.public_profiles from anon, authenticated;

-- 4. Lock the base table away from anonymous / public access. Even if a
--    permissive RLS policy lingers from earlier tooling, removing the
--    table-level SELECT privilege means anon can no longer read `profiles`
--    directly — RLS *and* table grants must both pass. The explicit grants to
--    `authenticated` and `service_role` from the initial migration are
--    untouched, so signed-in users keep own-row access and the server's
--    service-role client keeps full access.
revoke all on public.profiles from anon;
revoke all on public.profiles from public;
