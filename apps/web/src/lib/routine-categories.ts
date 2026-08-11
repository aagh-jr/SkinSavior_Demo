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

/**
 * Default a catalog product's coarse category to a canonical routine category.
 *
 * MUST stay in sync with the `products.canonical_category` generated column
 * (migration 20260810000000). `products.category` carries two naming schemes —
 * lowercase-plural from Open Beauty Facts ('sunscreens') and title-singular
 * from curated imports ('Sunscreen') — so both spellings are handled here.
 *
 * Prefer reading `products.canonical_category` where it's available; this
 * function is for values computed app-side before a row exists.
 */
export function coarseToCanonical(
  coarse: string | null,
  productName?: string | null,
): RoutineCategory {
  // 'Balm' covers both lip balms and face/body occlusives, so only the
  // product name separates them. Whole-word match, mirroring the SQL regex —
  // a looser test catches "Lipid" and "Lollipop".
  const name = (productName ?? "").trim();
  if (/(^|[^a-z])lip([^a-z]|$)/i.test(name)) return "lip_balm";

  switch ((coarse ?? "").trim().toLowerCase()) {
    case "cleanser":
    case "cleansers":
      return "cleanser";
    case "oil cleanser":
    case "cleansing oil":
    case "cleansing balm":
      return "oil_cleanser";
    case "sunscreen":
    case "sunscreens":
    case "spf":
      return "sunscreen";
    case "face-masks":
    case "face masks":
    case "mask":
    case "masks":
      return "mask";
    case "moisturizer":
    case "moisturizers":
    case "face-creams":
    case "face creams":
    case "cream":
    case "balm":
      return "moisturizer";
    case "serum":
    case "serums":
      return "serum";
    case "essence":
    case "essences":
    case "ampoule":
    case "ampoules":
      return "essence";
    case "toner":
    case "toners":
      return "toner";
    case "exfoliant":
    case "exfoliants":
    case "peeling":
    case "peel":
      return "exfoliant";
    case "eye cream":
    case "eye-cream":
    case "eye creams":
      return "eye_cream";
    case "treatment":
    case "treatments":
    case "spot treatment":
      return "spot_treatment";
    case "oil":
    case "oils":
    case "face oil":
      return "face_oil";
    default:
      return "other";
  }
}

/**
 * A placeholder slot seeded into a new routine from the quiz's
 * `current_routine` answer — an empty step the user fills with a real product.
 *
 * `timeOfDay` is a sensible default, not a rule: sunscreen is AM-only, and
 * photosensitising actives (retinoids, exfoliants) default to PM. Getting
 * these right at seed time means the compatibility checks have correct
 * timing to reason about even before the user edits anything.
 */
export interface SeedSlot {
  category: RoutineCategory;
  label: string;
  timeOfDay: TimeOfDay;
}

/** Quiz `current_routine` value -> the slot it should seed. */
const QUIZ_SLOTS: Record<string, SeedSlot> = {
  cleanser:    { category: "cleanser",    label: "Cleanser",          timeOfDay: "both" },
  toner:       { category: "toner",       label: "Toner",             timeOfDay: "both" },
  serum:       { category: "serum",       label: "Serum",             timeOfDay: "both" },
  moisturizer: { category: "moisturizer", label: "Moisturizer",       timeOfDay: "both" },
  spf:         { category: "sunscreen",   label: "Sunscreen",         timeOfDay: "am" },
  retinoid:    { category: "serum",       label: "Retinol / retinoid", timeOfDay: "pm" },
  exfoliant:   { category: "exfoliant",   label: "Exfoliant (AHA/BHA)", timeOfDay: "pm" },
};

/**
 * Turn the quiz's `current_routine` answer into ordered placeholder slots.
 *
 * Returning slots in `categoryRank` order means the seeded routine already
 * reads in the order it's applied (cleanser -> ... -> sunscreen). "none"
 * and unknown values are ignored, so a user starting fresh gets an empty
 * routine rather than a wrong one.
 */
export function quizAnswerToSeedSlots(currentRoutine: string[] | null): SeedSlot[] {
  if (!currentRoutine?.length) return [];
  const slots: SeedSlot[] = [];
  for (const answer of currentRoutine) {
    const slot = QUIZ_SLOTS[answer];
    // Same category can legitimately appear twice (a plain serum AND a
    // retinoid) — dedupe on the label, not the category.
    if (slot && !slots.some((s) => s.label === slot.label)) slots.push(slot);
  }
  return slots.sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}

// ---------------------------------------------------------------------------
// Quiz -> routine seeding
//
// The quiz asks which product types someone already uses (profiles.
// current_routine). Those answers seed labeled but empty steps in the routine
// builder, so a new user fills in blanks ("which cleanser?") instead of facing
// an empty page. Steps are created with product_id NULL; the user attaches the
// real product afterwards.
// ---------------------------------------------------------------------------

/** current_routine answer value -> the routine category it seeds. */
const QUIZ_ANSWER_TO_CATEGORY: Record<string, RoutineCategory> = {
  cleanser: "cleanser",
  toner: "toner",
  serum: "serum",
  moisturizer: "moisturizer",
  spf: "sunscreen",
  retinoid: "serum",
  exfoliant: "exfoliant",
};

/**
 * Default time of day for a seeded step.
 *
 * Sunscreen is morning-only and exfoliants/retinoids are evening-only —
 * both because they are photosensitising or should not be layered under sun
 * exposure. Seeding those defaults means a new routine starts out schedulable
 * rather than needing correction, and gives the compatibility checks
 * meaningful AM/PM data from day one.
 */
export function defaultTimeOfDay(category: RoutineCategory): TimeOfDay {
  switch (category) {
    case "sunscreen":
      return "am";
    case "exfoliant":
    case "spot_treatment":
      return "pm";
    default:
      return "both";
  }
}

/** Frequency an exfoliant should start at — daily is too aggressive. */
export function defaultFrequency(category: RoutineCategory): RoutineFrequency {
  return category === "exfoliant" ? "2x_week" : "daily";
}

/**
 * Map the quiz's `current_routine` answers to the categories to seed, in
 * canonical routine order. "none" (starting fresh) yields an empty list —
 * the caller decides what a blank routine looks like.
 */
export function quizAnswersToCategories(answers: string[] | null): RoutineCategory[] {
  if (!answers?.length) return [];
  const seen = new Set<RoutineCategory>();
  for (const a of answers) {
    const cat = QUIZ_ANSWER_TO_CATEGORY[a?.trim().toLowerCase()];
    if (cat) seen.add(cat);
  }
  return [...seen].sort((a, b) => categoryRank(a) - categoryRank(b));
}

/** Placeholder label stored on a seeded step until a product is attached. */
export function seededStepLabel(category: RoutineCategory): string {
  const found = ROUTINE_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : "Product";
}
