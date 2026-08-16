import { describe, expect, it } from "vitest";

import { analyzeRoutine, type RoutineStepInput, type TimeOfDay } from "./interactions";

const step = (
  label: string,
  timeOfDay: TimeOfDay,
  ingredients: string[],
  category?: string,
): RoutineStepInput => ({ id: label, label, timeOfDay, ingredients, category });

const SPF = step("Sunscreen", "am", ["homosalate", "avobenzone"], "sunscreen");

describe("the retinol-in-the-morning question", () => {
  it("flags a retinoid scheduled for the morning", () => {
    const report = analyzeRoutine([
      step("Retinol Serum", "am", ["aqua", "retinol"]),
      SPF,
    ]);
    const finding = report.findings.find((f) => f.code === "retinoid_in_am");
    expect(finding).toBeDefined();
    expect(finding!.recommendation).toMatch(/evening/i);
  });

  it("does not flag a retinoid used at night", () => {
    const report = analyzeRoutine([
      step("Retinol Serum", "pm", ["aqua", "retinol"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code === "retinoid_in_am")).toBe(false);
  });

  it("flags a sun-sensitising active when the routine has no daytime SPF", () => {
    const report = analyzeRoutine([step("Retinol Serum", "pm", ["aqua", "retinol"])]);
    const finding = report.findings.find((f) => f.code === "photosensitiser_without_spf");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("major");
    expect(finding!.ingredients).toContain("retinol");
  });

  it("is satisfied by a sunscreen anywhere in the morning routine", () => {
    const report = analyzeRoutine([
      step("Retinol Serum", "pm", ["aqua", "retinol"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code === "photosensitiser_without_spf")).toBe(false);
  });

  it("does not demand SPF when nothing in the routine is sun-sensitising", () => {
    const report = analyzeRoutine([
      step("Gentle Cleanser", "both", ["aqua", "glycerin"]),
      step("Moisturiser", "both", ["aqua", "ceramide np"]),
    ]);
    expect(report.verdict).toBe("no_clashes");
  });
});

describe("pairwise clashes", () => {
  it("flags a retinoid and an AHA used at the same time", () => {
    const report = analyzeRoutine([
      step("Retinol Serum", "pm", ["retinol"]),
      step("Glycolic Toner", "pm", ["glycolic acid"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code === "retinoid_plus_aha")).toBe(true);
    expect(report.verdict).toBe("major_clashes");
  });

  it("clears the same pair when they're split across AM and PM", () => {
    // sameTimeOnly rules are about co-application, so alternating resolves them.
    const report = analyzeRoutine([
      step("Retinol Serum", "pm", ["retinol"]),
      step("Glycolic Toner", "am", ["glycolic acid"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code === "retinoid_plus_aha")).toBe(false);
  });

  it("flags a physical scrub with a retinoid however they are scheduled", () => {
    // Not sameTimeOnly — fragile skin stays fragile the next morning.
    const report = analyzeRoutine([
      step("Retinol Serum", "pm", ["retinol"]),
      step("Face Scrub", "am", ["juglans regia shell powder"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code === "scrub_plus_retinoid")).toBe(true);
  });

  it("flags benzoyl peroxide layered with a retinoid", () => {
    const report = analyzeRoutine([
      step("BP Treatment", "pm", ["benzoyl peroxide"]),
      step("Retinol", "pm", ["retinol"]),
      SPF,
    ]);
    const finding = report.findings.find((f) => f.code === "retinoid_plus_benzoyl_peroxide");
    expect(finding).toBeDefined();
    // The adapalene exception is real and worth stating rather than blanket-warning.
    expect(finding!.explanation).toMatch(/adapalene/i);
  });

  it("treats vitamin C with an acid as minor, not major", () => {
    const report = analyzeRoutine([
      step("Vitamin C", "am", ["ascorbic acid"]),
      step("Glycolic Toner", "am", ["glycolic acid"]),
      SPF,
    ]);
    const finding = report.findings.find((f) => f.code === "vitamin_c_plus_aha");
    expect(finding?.severity).toBe("minor");
  });
});

describe("not fearmongering", () => {
  it("reassures about niacinamide + vitamin C instead of flagging it", () => {
    const report = analyzeRoutine([
      step("Niacinamide Serum", "am", ["niacinamide"]),
      step("Vitamin C Serum", "am", ["ascorbic acid"]),
      SPF,
    ]);
    expect(report.findings.some((f) => f.code.includes("niacinamide"))).toBe(false);
    expect(report.reassurances.some((r) => r.code === "niacinamide_plus_vitamin_c_myth")).toBe(true);
  });

  it("carries an evidence tier on every finding", () => {
    // Users need to tell documented pharmacology from repeated folklore.
    const report = analyzeRoutine([
      step("Retinol", "pm", ["retinol"]),
      step("Glycolic Toner", "pm", ["glycolic acid"]),
    ]);
    for (const f of report.findings) {
      expect(["A", "B", "C", "D"]).toContain(f.evidenceTier);
    }
  });
});

describe("determinism", () => {
  it("returns identical findings for identical routines", () => {
    const routine = [
      step("Retinol", "pm", ["retinol"]),
      step("Glycolic Toner", "pm", ["glycolic acid"]),
      SPF,
    ];
    expect(analyzeRoutine(routine)).toEqual(analyzeRoutine(routine));
  });

  it("sorts major findings before minor ones", () => {
    const report = analyzeRoutine([
      step("Retinol", "am", ["retinol"]),
      step("Glycolic Toner", "pm", ["glycolic acid"]),
    ]);
    const severities = report.findings.map((f) => f.severity);
    expect(severities).toEqual([...severities].sort((a, b) => (a === "major" ? -1 : 1)));
  });

  it("does not duplicate a finding for the same pair of steps", () => {
    const report = analyzeRoutine([
      step("Retinol", "pm", ["retinol", "retinal"]),
      step("Acid Toner", "pm", ["glycolic acid", "lactic acid"]),
      SPF,
    ]);
    const codes = report.findings.map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
