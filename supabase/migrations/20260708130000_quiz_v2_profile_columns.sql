-- Quiz v2 (7 questions): make sure profiles has every column the survey
-- persists. The live table drifted from 20260614003002 and only has
-- skin_type; budget is now multi-select and reactions is stored in its
-- own column. Convert budget from TEXT where an old single-select column
-- exists (local DBs built from migrations), otherwise add it as TEXT[].

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'budget' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN budget TYPE TEXT[]
      USING CASE WHEN budget IS NULL THEN NULL ELSE ARRAY[budget] END;
    ALTER TABLE public.profiles ALTER COLUMN budget SET DEFAULT '{}';
  END IF;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sensitivity TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sun_exposure TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS routine_complexity TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reactions TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
