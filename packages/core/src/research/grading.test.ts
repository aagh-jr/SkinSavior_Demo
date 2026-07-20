import { describe, it, expect } from "vitest";
import {
  gradeClaim,
  CERTAINTY_META,
  DESIGN_TIER_LABELS,
  type StudyInput,
  type Certainty,
  type DesignLevel,
} from "./grading";

/** A clean, high-quality study; override fields per test. */
function study(overrides: Partial<StudyInput> = {}): StudyInput {
  return {
    design_level: "2",
    sample_size: 100,
    conflict_flag: false,
    effect_direction: "positive",
    concentration: "5%",
    vehicle: "cream",
    outcome_measured: "visible skin tone",
    effect_size: "moderate",
    ...overrides,
  };
}

const codes = (r: ReturnType<typeof gradeClaim>) => r.reasons.map((x) => x.code);

describe("gradeClaim", () => {
  it("empty study set floors to very_limited", () => {
    const r = gradeClaim([]);
    expect(r.certainty).toBe("very_limited");
    expect(codes(r)).toContain("no_studies");
  });

  it("clean RCT body of evidence grades strong", () => {
    const r = gradeClaim([study(), study()]);
    expect(r.certainty).toBe("strong");
    expect(codes(r)).toContain("rct_baseline");
  });

  it("mechanism-only evidence is floored at very_limited regardless of anything", () => {
    // Two big, clean, positive Level-5 studies — would otherwise look good.
    const r = gradeClaim([
      study({ design_level: "5", sample_size: 5000 }),
      study({ design_level: "5", sample_size: 5000 }),
    ]);
    expect(r.certainty).toBe("very_limited");
    expect(codes(r)).toEqual(["mechanism_only"]);
  });

  it("observational body of evidence starts at limited", () => {
    const r = gradeClaim([
      study({ design_level: "3", effect_size: null }),
      study({ design_level: "4", effect_size: null }),
    ]);
    expect(r.certainty).toBe("limited");
    expect(codes(r)).toContain("observational_baseline");
  });

  it("downgrades RCT evidence for inconsistent directions", () => {
    const r = gradeClaim([
      study({ effect_direction: "positive" }),
      study({ effect_direction: "null" }),
    ]);
    expect(r.certainty).toBe("moderate"); // strong (4) - 1
    expect(codes(r)).toContain("inconsistency");
  });

  it("downgrades for indirectness when outcomes are biomarkers", () => {
    const r = gradeClaim([
      study({ outcome_measured: "collagen synthesis assay" }),
      study({ outcome_measured: "visible firmness" }),
    ]);
    expect(codes(r)).toContain("indirectness");
    expect(r.certainty).toBe("moderate"); // 4 - 1 (mixed, so -1 not -2)
  });

  it("applies a double indirectness downgrade when ALL outcomes are biomarkers", () => {
    const r = gradeClaim([
      study({ outcome_measured: "gene expression" }),
      study({ outcome_measured: "fibroblast assay" }),
    ]);
    expect(codes(r)).toContain("indirectness");
    expect(r.certainty).toBe("limited"); // 4 - 2
  });

  it("downgrades for imprecision only when every study is small", () => {
    const allSmall = gradeClaim([
      study({ sample_size: 12 }),
      study({ sample_size: 20 }),
    ]);
    expect(codes(allSmall)).toContain("imprecision");

    const oneLarge = gradeClaim([
      study({ sample_size: 12 }),
      study({ sample_size: 200 }),
    ]);
    expect(codes(oneLarge)).not.toContain("imprecision");
  });

  it("flags sponsorship as its own reason when the majority is industry-funded", () => {
    const r = gradeClaim([
      study({ conflict_flag: true }),
      study({ conflict_flag: true }),
      study({ conflict_flag: false }),
    ]);
    expect(codes(r)).toContain("sponsorship");
    expect(r.certainty).toBe("moderate"); // 4 - 1
  });

  it("does not flag sponsorship below the majority threshold", () => {
    const r = gradeClaim([
      study({ conflict_flag: true }),
      study({ conflict_flag: false }),
      study({ conflict_flag: false }),
    ]);
    expect(codes(r)).not.toContain("sponsorship");
    expect(r.certainty).toBe("strong");
  });

  it("upgrades observational evidence for a large effect", () => {
    const r = gradeClaim([
      study({ design_level: "3", effect_size: "large", vehicle: "cream" }),
      study({ design_level: "3", effect_size: "large", vehicle: "cream" }),
    ]);
    expect(codes(r)).toContain("large_effect");
    expect(r.certainty).toBe("moderate"); // low (2) + 1
  });

  it("does not upgrade RCT evidence for a large effect", () => {
    const r = gradeClaim([study({ effect_size: "large" }), study({ effect_size: "large" })]);
    expect(codes(r)).not.toContain("large_effect");
    expect(r.certainty).toBe("strong");
  });

  it("has display metadata for every certainty grade, notches matching rank order", () => {
    const grades: Certainty[] = ["strong", "moderate", "limited", "very_limited"];
    for (const g of grades) {
      expect(CERTAINTY_META[g]).toBeDefined();
      expect(CERTAINTY_META[g].label).toMatch(/evidence/i);
    }
    // Notches strictly decrease strong -> very_limited.
    expect(grades.map((g) => CERTAINTY_META[g].notches)).toEqual([4, 3, 2, 1]);
    // Every gradeClaim output is renderable.
    expect(CERTAINTY_META[gradeClaim([]).certainty]).toBeDefined();
  });

  it("has a design-tier label for every CEBM level", () => {
    const levels: DesignLevel[] = ["1", "2", "3", "4", "5"];
    for (const l of levels) expect(DESIGN_TIER_LABELS[l]).toBeTruthy();
  });

  it("clamps at very_limited under stacked downgrades", () => {
    const r = gradeClaim([
      study({
        design_level: "3",
        effect_direction: "positive",
        outcome_measured: "gene expression assay",
        sample_size: 8,
        conflict_flag: true,
        effect_size: null,
      }),
      study({
        design_level: "4",
        effect_direction: "null",
        outcome_measured: "fibroblast assay",
        sample_size: 10,
        conflict_flag: true,
        effect_size: null,
      }),
    ]);
    expect(r.certainty).toBe("very_limited");
  });
});
