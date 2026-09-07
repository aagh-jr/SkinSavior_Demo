-- Tracks when a user last completed the skin quiz, independent of
-- profiles.updated_at (which is touched by unrelated writes: display name,
-- avatar, primary_routine_id). Settings shows this as "Last taken …" and
-- needs it to change only when the quiz itself is (re)submitted.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_taken_at TIMESTAMPTZ;

-- Backfill: anyone who already has quiz answers took it at some point.
-- updated_at is the closest signal we have for existing rows.
UPDATE public.profiles
SET quiz_taken_at = updated_at
WHERE quiz_taken_at IS NULL AND skin_type IS NOT NULL;
