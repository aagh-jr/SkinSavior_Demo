-- Routines can carry a short description alongside their name, shown on the
-- routine cards and editable from the builder's edit mode.
alter table public.skincare_routines
  add column if not exists description text;
