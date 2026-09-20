/**
 * Fake routines for Storybook, typed against BuilderStep / RoutineSummary.
 *
 * Includes an AM routine, a PM routine, an empty routine, and a routine that
 * pairs a retinoid with a 2% BHA on the same PM slot — a real clash under
 * interactions.ts (`retinoid_plus_bha`, major).
 */
import type { BuilderStep, RoutineSummary } from "@skinsavior/core/types";
import {
  niacinamideSerum,
  vitaminCSerum,
  gentleCleanser,
  ceramideMoisturizer,
  mineralSunscreen,
  bhaToner,
  retinoidSerum,
} from "./products.fixtures";
import type { Product } from "@skinsavior/core/types";
import type { RoutineCategory } from "@skinsavior/core/types";

let seq = 0;
const step = (
  p: Product,
  category: RoutineCategory,
  timeOfDay: BuilderStep["timeOfDay"],
  frequency: BuilderStep["frequency"] = "daily",
): BuilderStep => ({
  id: `step-${++seq}`,
  productId: `prod-${p.slug}`,
  productSlug: p.slug,
  productName: p.name,
  productBrand: p.brand,
  productImage: p.imageUrl ?? null,
  category,
  timeOfDay,
  frequency,
  customDays: [],
});

/** A clean morning routine: cleanse → vitamin C → moisturize → SPF. */
export const amRoutineSteps: BuilderStep[] = [
  step(gentleCleanser, "cleanser", "am"),
  step(vitaminCSerum, "serum", "am"),
  step(niacinamideSerum, "serum", "am"),
  step(ceramideMoisturizer, "moisturizer", "am"),
  step(mineralSunscreen, "sunscreen", "am"),
];

/** A clean evening routine: cleanse → retinoid → moisturize. */
export const pmRoutineSteps: BuilderStep[] = [
  step(gentleCleanser, "cleanser", "pm"),
  step(retinoidSerum, "serum", "pm"),
  step(ceramideMoisturizer, "moisturizer", "pm"),
];

/** A routine with a real clash: retinoid + 2% BHA on the same PM slot. */
export const clashingRoutineSteps: BuilderStep[] = [
  step(gentleCleanser, "cleanser", "pm"),
  step(bhaToner, "toner", "pm"),
  step(retinoidSerum, "serum", "pm"),
  step(ceramideMoisturizer, "moisturizer", "pm"),
];

/** An empty routine — the "add your first product" state. */
export const emptyRoutineSteps: BuilderStep[] = [];

export const routineSummaries: RoutineSummary[] = [
  {
    id: "routine-am",
    name: "Morning routine",
    description: "Antioxidant + SPF to start the day.",
    stepCount: amRoutineSteps.length,
    isPrimary: true,
    createdAt: "2026-05-01T08:00:00.000Z",
  },
  {
    id: "routine-pm",
    name: "Evening routine",
    description: "Retinoid night, kept simple.",
    stepCount: pmRoutineSteps.length,
    isPrimary: false,
    createdAt: "2026-05-02T21:00:00.000Z",
  },
  {
    id: "routine-empty",
    name: "Weekend reset",
    description: null,
    stepCount: 0,
    isPrimary: false,
    createdAt: "2026-06-10T10:00:00.000Z",
  },
];

export const emptyRoutineSummaries: RoutineSummary[] = [];
