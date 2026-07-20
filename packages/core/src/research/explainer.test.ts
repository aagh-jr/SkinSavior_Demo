import { describe, expect, it } from "vitest";
import { buildExplainerPrompt, checkExplainerText } from "./explainer";

describe("checkExplainerText", () => {
  it("passes compliant evidence-framing prose", () => {
    const { ok, violations } = checkExplainerText(
      "Two randomized trials measured a visible reduction in dark spots after eight weeks. " +
        "Both studies were small, so the size of the effect is uncertain.",
    );
    expect(violations).toEqual([]);
    expect(ok).toBe(true);
  });

  it("allows past-tense / noun structure framing the policy explicitly permits", () => {
    const { ok } = checkExplainerText(
      "One lab study measured increased collagen mRNA in cultured skin cells.",
    );
    expect(ok).toBe(true);
  });

  it("catches drug verbs in any form", () => {
    for (const text of [
      "This treats dark spots.",
      "Participants were treated with a 4% cream.",
      "It may help prevent wrinkles.",
      "The cream heals the skin.",
      "It reverses sun damage.",
    ]) {
      expect(checkExplainerText(text).ok).toBe(false);
    }
    expect(checkExplainerText("This treats dark spots.").violations[0].code).toBe("drug_verb");
  });

  it("catches disease names", () => {
    const { ok, violations } = checkExplainerText(
      "A trial in melasma patients found lighter patches.",
    );
    expect(ok).toBe(false);
    expect(violations.some((v) => v.code === "disease_term")).toBe(true);
  });

  it("catches present-tense structure-function assertions", () => {
    const { ok, violations } = checkExplainerText("Niacinamide boosts collagen in the skin.");
    expect(ok).toBe(false);
    expect(violations.some((v) => v.code === "structure_function")).toBe(true);
    // with words in between
    expect(checkExplainerText("It stimulates the production of collagen.").ok).toBe(false);
  });

  it("catches second-person structure framing", () => {
    const { ok, violations } = checkExplainerText("It supports your skin barrier every day.");
    expect(ok).toBe(false);
    expect(violations.some((v) => v.code === "second_person_structure")).toBe(true);
  });

  it("catches promises and proven-language", () => {
    expect(checkExplainerText("Regular use will smooth fine lines.").ok).toBe(false);
    expect(checkExplainerText("This ingredient is clinically proven.").ok).toBe(false);
    expect(checkExplainerText("It is effective for tone.").ok).toBe(false);
  });

  it("reports every violation with its rule code and match", () => {
    const { violations } = checkExplainerText(
      "Proven to cure acne — it boosts collagen and your barrier will improve.",
    );
    const codes = violations.map((v) => v.code);
    expect(codes).toContain("drug_verb");
    expect(codes).toContain("disease_term");
    expect(codes).toContain("structure_function");
    for (const v of violations) expect(v.match.length).toBeGreaterThan(0);
  });

  it("is reusable across calls (global regex state does not leak)", () => {
    expect(checkExplainerText("It cures everything.").ok).toBe(false);
    expect(checkExplainerText("It cures everything.").ok).toBe(false);
    expect(checkExplainerText("A calm factual sentence about studies.").ok).toBe(true);
  });
});

describe("buildExplainerPrompt", () => {
  const input = {
    badgeLabel: "Evens tone",
    cardText: "Helps even the look of uneven tone and dark spots",
    certaintyLabel: "Moderate evidence",
    reasons: [
      "Backed by one or more randomized human trials.",
      "Most of the studies were industry-funded.",
    ],
    studies: [
      { tierLabel: "Randomized trial", title: "Niacinamide and facial pigmentation", sampleSize: 42 },
      { tierLabel: "Lab study", title: "Melanosome transfer in vitro", sampleSize: null },
    ],
  };

  it("includes the claim, grade, reasons and every study", () => {
    const { system, user } = buildExplainerPrompt(input);
    expect(user).toContain("Helps even the look of uneven tone and dark spots");
    expect(user).toContain("Moderate evidence");
    expect(user).toContain("industry-funded");
    expect(user).toContain("Niacinamide and facial pigmentation");
    expect(user).toContain("Melanosome transfer in vitro");
    expect(system.length).toBeGreaterThan(0);
  });

  it("tags each study with its design tier and sample size when known", () => {
    const { user } = buildExplainerPrompt(input);
    expect(user).toContain("[Randomized trial, n=42]");
    expect(user).toContain("[Lab study]");
  });

  it("instructs evidence-only framing in the system prompt", () => {
    const { system } = buildExplainerPrompt(input);
    expect(system).toMatch(/never about what a product/i);
    expect(system).toMatch(/only the studies listed/i);
  });
});
