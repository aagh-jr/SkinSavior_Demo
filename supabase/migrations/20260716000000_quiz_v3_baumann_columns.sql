-- Quiz v3: expand the skin profile from a single oily/dry bucket to the
-- four independent Baumann Skin Type axes (oily/dry, sensitive/resistant,
-- pigmented/non-pigmented, wrinkle-prone/tight), a Fitzpatrick-style sun
-- reaction question, and the safety-relevant fields standard on dermatology
-- intake forms (current medications, pregnancy/breastfeeding, current
-- routine). `skin_type` and `sensitivity` are existing columns — we keep
-- them but the quiz now populates them from more precise, behavior-based
-- questions instead of a single self-labeled dropdown.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pigmentation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aging_concern TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sun_reaction TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pregnancy_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_routine TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.pigmentation IS
  'Baumann axis 3 (pigmented/non-pigmented): none | occasional_marks | persistent_spots';
COMMENT ON COLUMN public.profiles.aging_concern IS
  'Baumann axis 4 (wrinkle-prone/tight): smooth | fine_lines | visible_wrinkles';
COMMENT ON COLUMN public.profiles.sun_reaction IS
  'Fitzpatrick-lite phototype proxy: always_burns | burns_then_tans | tans_easily | never_burns';
COMMENT ON COLUMN public.profiles.medications IS
  'Prescription treatments relevant to ingredient safety: retinoid_rx | isotretinoin | other_topical_rx | none';
COMMENT ON COLUMN public.profiles.pregnancy_status IS
  'Safety flag for retinoid/salicylic-acid warnings: pregnant_or_breastfeeding | not_applicable | prefer_not_to_say';
COMMENT ON COLUMN public.profiles.current_routine IS
  'Product categories already in use, to avoid redundant recommendations.';
