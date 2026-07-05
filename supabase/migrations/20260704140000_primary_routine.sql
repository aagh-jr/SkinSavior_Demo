-- A user can mark one routine as their "primary" — the one surfaced on the
-- home page under "Your current routine". Stored on the profile (one per user);
-- clears itself if that routine is deleted.
alter table public.profiles
  add column if not exists primary_routine_id uuid
  references public.skincare_routines(id) on delete set null;
