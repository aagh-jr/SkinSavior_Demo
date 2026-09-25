/**
 * Fake routines for Storybook, typed against BuilderStep / RoutineSummary.
 *
 * Includes an AM routine, a PM routine, an empty routine, and a routine that
 * pairs a retinoid with a 2% BHA on the same PM slot — a real clash under
 * interactions.ts (`retinoid_plus_bha`, major).
 */
import type { BuilderStep, RoutineSummary } from "@skinsavior/core/types";
import type { CompatibilityReport } from "@skinsavior/core/scoring";
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

// ---------------------------------------------------------------------------
// Compatibility reports (the RoutineCompatibility component's input), matching
// the real rules in packages/core/src/scoring/interactions.ts.
// ---------------------------------------------------------------------------

/** The niacinamide + vitamin C reassurance — a debunked "clash". */
const niacinamideVitCReassurance = {
  code: "niacinamide_plus_vitamin_c_myth",
  note: "Niacinamide and vitamin C are fine together. The idea that they cancel out traces to mid-century experiments on raw ingredients under heat, not finished products.",
};

/** No clashes — but still corrects a commonly-feared pair. */
export const noClashReport: CompatibilityReport = {
  verdict: "no_clashes",
  findings: [],
  reassurances: [niacinamideVitCReassurance],
};

/** A major clash: retinoid + 2% BHA on the same PM slot. */
export const majorClashReport: CompatibilityReport = {
  verdict: "major_clashes",
  findings: [
    {
      code: "retinoid_plus_bha",
      severity: "major",
      title: "Retinoid + BHA on the same night",
      explanation:
        "Using a retinoid and a salicylic-acid (BHA) exfoliant together can over-exfoliate and irritate the barrier for many people.",
      recommendation: "Alternate nights, or move the BHA to your morning routine.",
      evidenceTier: "B",
      steps: ["Retinal 0.2% Emulsion", "Skin Perfecting 2% BHA Liquid Exfoliant"],
      ingredients: ["Retinal", "Salicylic Acid"],
    },
  ],
  reassurances: [niacinamideVitCReassurance],
};

/** A minor clash: vitamin C layered with an AHA. */
export const minorClashReport: CompatibilityReport = {
  verdict: "minor_clashes",
  findings: [
    {
      code: "vitamin_c_plus_aha",
      severity: "minor",
      title: "Vitamin C with an AHA",
      explanation:
        "Both are low-pH actives; layering them can sting or reduce vitamin C stability for some people, though many tolerate it.",
      recommendation: "If you notice stinging, use them at different times of day.",
      evidenceTier: "C",
      steps: ["C E Ferulic", "Glycolic Acid Toner"],
      ingredients: ["Ascorbic Acid", "Glycolic Acid"],
    },
  ],
  reassurances: [],
};
