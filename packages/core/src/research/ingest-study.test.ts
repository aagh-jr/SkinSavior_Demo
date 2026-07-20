import { describe, it, expect } from "vitest";
import { wouldFlipGrade } from "./ingest-study";
import type { StudyInput } from "./grading";

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

describe("wouldFlipGrade", () => {
  it("does not flip when the candidate is redundant with strong existing evidence", () => {
    const accepted = [study(), study()]; // already strong
    expect(wouldFlipGrade(accepted, study())).toBe(false);
  });

  it("flips when a lone RCT founds a previously empty claim at a higher grade", () => {
    // Empty accepted set grades very_limited; a clean RCT makes it strong.
    expect(wouldFlipGrade([], study())).toBe(true);
  });

  it("does not flip when a founding study also grades very_limited", () => {
    // A single mechanism-only study is floored at very_limited — same as empty.
    expect(wouldFlipGrade([], study({ design_level: "5" }))).toBe(false);
  });

  it("flips when adding an inconsistent result downgrades the body of evidence", () => {
    const accepted = [study({ effect_direction: "positive" })]; // strong
    // A contradicting study introduces inconsistency -> moderate.
    expect(wouldFlipGrade(accepted, study({ effect_direction: "null" }))).toBe(true);
  });

  it("does not flip when adding a same-direction study keeps the grade", () => {
    const accepted = [study({ design_level: "3", effect_size: null })]; // limited
    expect(
      wouldFlipGrade(accepted, study({ design_level: "3", effect_size: null })),
    ).toBe(false);
  });
});
