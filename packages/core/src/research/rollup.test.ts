import { describe, expect, it } from "vitest";
import { rollupEvidence } from "./rollup";

describe("rollupEvidence", () => {
  it("returns null when there are no claims", () => {
    expect(rollupEvidence([])).toBeNull();
  });

  it("summarizes a single claim", () => {
    const r = rollupEvidence(["moderate"]);
    expect(r).not.toBeNull();
    expect(r!.total).toBe(1);
    expect(r!.best).toBe("moderate");
    expect(r!.counts).toEqual({ strong: 0, moderate: 1, limited: 0, very_limited: 0 });
    expect(r!.headline).toBe("1 graded claim — moderate evidence");
  });

  it("picks the strongest tier present as best", () => {
    const r = rollupEvidence(["very_limited", "moderate", "limited"]);
    expect(r!.best).toBe("moderate");
  });

  it("counts claims per tier", () => {
    const r = rollupEvidence(["strong", "moderate", "moderate", "very_limited"]);
    expect(r!.counts).toEqual({ strong: 1, moderate: 2, limited: 0, very_limited: 1 });
    expect(r!.total).toBe(4);
  });

  it("phrases a mixed rollup as 'behind N of M claims'", () => {
    const r = rollupEvidence(["strong", "strong", "limited"]);
    expect(r!.headline).toBe("Strong evidence behind 2 of 3 claims");
  });

  it("phrases a uniform rollup as 'behind all N claims'", () => {
    const r = rollupEvidence(["moderate", "moderate"]);
    expect(r!.headline).toBe("Moderate evidence behind all 2 claims");
  });

  it("never produces a product-efficacy word in the headline", () => {
    const r = rollupEvidence(["strong", "very_limited"]);
    expect(r!.headline).not.toMatch(/works|effective|proven/i);
  });
});
