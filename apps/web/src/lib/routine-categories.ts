// Canonical routine-step categories, time-of-day and frequency values.
// Category array order = the auto-sort order the routine builder uses
// (oil cleanser first … sunscreen last).
//
// The value lists must stay in sync with the check constraints in
// supabase/migrations/20260704000000_routine_builder_steps.sql — a mismatch
// surfaces only as a runtime 23514 check-violation error.

export type TimeOfDay = "am" | "pm" | "both";

export type RoutineFrequency =
  | "daily"
  | "every_other_day"
  | "2x_week"
  | "weekly"
  | "custom";

export const ROUTINE_FREQUENCIES: { value: RoutineFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "2x_week", label: "2× a week" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom days" },
];

/** Index = the custom_days value stored in the DB (0 = Monday … 6 = Sunday). */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type RoutineCategory =
  | "oil_cleanser"
  | "cleanser"
  | "exfoliant"
  | "mask"
  | "toner"
  | "essence"
  | "serum"
  | "eye_cream"
  | "spot_treatment"
  | "moisturizer"
  | "face_oil"
  | "lip_balm"
  | "sunscreen"
  | "other";

export const ROUTINE_CATEGORIES: { value: RoutineCategory; label: string }[] = [
  { value: "oil_cleanser", label: "Oil cleanser" },
  { value: "cleanser", label: "Cleanser" },
  { value: "exfoliant", label: "Exfoliant" },
  { value: "mask", label: "Mask" },
  { value: "toner", label: "Toner" },
  { value: "essence", label: "Essence" },
  { value: "serum", label: "Serum" },
  { value: "eye_cream", label: "Eye cream" },
  { value: "spot_treatment", label: "Spot treatment" },
  { value: "moisturizer", label: "Moisturizer" },
  { value: "face_oil", label: "Face oil" },
  { value: "lip_balm", label: "Lip balm" },
  { value: "sunscreen", label: "Sunscreen" },
  { value: "other", label: "Other" },
];

/** Sort rank for auto-ordering; unknown values sort with "other". */
export function categoryRank(cat: string): number {
  const i = ROUTINE_CATEGORIES.findIndex((c) => c.value === cat);
  return i === -1 ? ROUTINE_CATEGORIES.length - 1 : i;
}

/** Default a catalog product's coarse category to a canonical routine category. */
export function coarseToCanonical(coarse: string | null): RoutineCategory {
  switch ((coarse ?? "").trim().toLowerCase()) {
    case "cleanser":
    case "cleansers":
      return "cleanser";
    case "sunscreen":
    case "sunscreens":
      return "sunscreen";
    case "face-masks":
    case "mask":
    case "masks":
      return "mask";
    case "moisturizer":
    case "moisturizers":
    case "face-creams":
      return "moisturizer";
    case "serum":
    case "serums":
      return "serum";
    case "toner":
    case "toners":
      return "toner";
    default:
      return "other";
  }
}
