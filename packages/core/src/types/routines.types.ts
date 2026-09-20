/**
 * Shared domain types for the routine builder.
 *
 * The canonical value lists and seeding logic live in the web app
 * (apps/web/src/lib/routine-categories.ts), which re-exports the union types
 * below. `BuilderStep`, `StepPatch` and `RoutineSummary` are read by
 * apps/web/src/lib/routines-db.ts and rendered by the routine components; they
 * live here so visual components depend on the shared contract rather than on
 * the database module.
 */

export type TimeOfDay = "am" | "pm" | "both";

export type RoutineFrequency =
  | "daily"
  | "every_other_day"
  | "2x_week"
  | "weekly"
  | "custom";

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

/** One step in a user's routine, shaped for the builder UI. */
export interface BuilderStep {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productName: string;
  productBrand: string;
  productImage: string | null;
  category: RoutineCategory;
  timeOfDay: TimeOfDay;
  frequency: RoutineFrequency;
  customDays: number[];
}

/** A partial update to a routine step. */
export interface StepPatch {
  timeOfDay?: TimeOfDay;
  frequency?: RoutineFrequency;
  customDays?: number[];
  category?: RoutineCategory;
}

/** A routine as summarized in list views (My shelf, routines index). */
export interface RoutineSummary {
  id: string;
  name: string;
  description: string | null;
  stepCount: number;
  isPrimary: boolean;
  createdAt: string;
}
