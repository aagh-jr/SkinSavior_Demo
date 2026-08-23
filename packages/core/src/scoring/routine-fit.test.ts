import { describe, expect, it } from "vitest";

import { findRoutineConflicts, rankProductsForRoutine, scoreProductForRoutine } from "./routine-fit";
import type { RoutineStepInput } from "./interactions";
import type { ScorableProduct, SkinProfile } from "./match";

const step = (
  id: string, timeOfDay: "am" | "pm" | "both", ingredients: string[], category?: string,
): RoutineStepInput => ({ id, label: id, timeOfDay, ingredients, category });

const product = (id: string, inci: string[], category = "serum"): ScorableProduct => ({
  id,
  canonicalCategory: category,
  ingredients: inci.map((inciName, i) => ({ inciName, position: i + 1, functions: null })),
});

const PROFILE: SkinProfile = {
  skinType: "combination", sensitivity: "sensitive", pigmentation: "moderate",
  agingConcern: "early", pregnancyStatus: "not_pregnant",
  medications: [], reactions: [], currentRoutine: [],
};

describe("scoring a product against the routine you already own", () => {
  it("flags an exfoliant when the routine already has a retinoid", () => {
    const fit = findRoutineConflicts(
      { id: "cand", ingredients: ["aqua", "glycolic acid"] },
      [step("My Retinol Serum", "pm", ["aqua", "retinol"])],
    );
    expect(fit.conflicts.length).toBeGreaterThan(0);
    expect(fit.unchecked).toBe(false);
    expect(fit.conflicts.some((c) => c.steps.includes("My Retinol Serum"))).toBe(true);
  });

  it("reports no conflict for a product that shares nothing with the routine", () => {
    const fit = findRoutineConflicts(
      { id: "cand", ingredients: ["aqua", "glycerin", "sodium hyaluronate"] },
      [step("Gentle Cleanser", "both", ["aqua", "coco-betaine"])],
    );
    expect(fit.conflicts).toHaveLength(0);
    expect(fit.worstSeverity).toBeNull();
  });

  // The distinction this whole module depends on: an empty routine produces no
  // findings, which must NOT be presented as "we checked and it's fine".
  it("marks an empty routine as unchecked rather than clean", () => {
    const fit = findRoutineConflicts({ id: "cand", ingredients: ["retinol"] }, []);
    expect(fit.conflicts).toHaveLength(0);
    expect(fit.unchecked).toBe(true);
  });

  it("does not report a product clashing with itself", () => {
    const fit = findRoutineConflicts(
      { id: "same", ingredients: ["aqua", "retinol"] },
      [step("same", "pm", ["aqua", "retinol"])],
    );
    expect(fit.conflicts).toHaveLength(0);
    expect(fit.unchecked).toBe(true);
  });

  it("ignores clashes between two products that are both already in the routine", () => {
    const fit = findRoutineConflicts(
      { id: "cand", ingredients: ["aqua", "glycerin"] },
      [
        step("Retinol Serum", "pm", ["aqua", "retinol"]),
        step("Glycolic Toner", "pm", ["aqua", "glycolic acid"]),
      ],
    );
    // Those two clash with each other, but that is not this product's doing.
    expect(fit.conflicts).toHaveLength(0);
  });

  it("renames the candidate to something renderable", () => {
    const fit = findRoutineConflicts(
      { id: "cand", ingredients: ["aqua", "glycolic acid"] },
      [step("My Retinol Serum", "pm", ["aqua", "retinol"])],
    );
    for (const c of fit.conflicts) {
      expect(c.steps.join(" ")).not.toContain("\u0000");
      expect(c.title).not.toContain("\u0000");
    }
    expect(fit.conflicts.some((c) => c.steps.includes("This product"))).toBe(true);
  });

  // The rule this module is built around, and the one most likely to be
  // "optimised" away later: a conflict is reported, never priced in.
  it("does not let a conflict change the score", () => {
    const candidate = product("cand", ["aqua", "glycolic acid"], "exfoliant");
    const alone = scoreProductForRoutine(PROFILE, candidate, []);
    const withRetinoid = scoreProductForRoutine(PROFILE, candidate, [
      step("My Retinol Serum", "pm", ["aqua", "retinol"]),
    ]);
    expect(withRetinoid.fit.conflicts.length).toBeGreaterThan(0);
    expect(withRetinoid.score).toBe(alone.score);
  });

  it("counts how many of a ranked list interact with the routine", () => {
    const routine = [step("My Retinol Serum", "pm", ["aqua", "retinol"])];
    const { ranked, conflictCount } = rankProductsForRoutine(
      PROFILE,
      [
        product("clashes", ["aqua", "glycolic acid"], "exfoliant"),
        product("fine", ["aqua", "glycerin", "sodium hyaluronate"]),
      ],
      routine,
    );
    expect(ranked).toHaveLength(2);
    expect(conflictCount).toBe(1);
  });
});
