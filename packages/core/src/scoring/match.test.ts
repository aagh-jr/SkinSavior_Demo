import { describe, expect, it } from "vitest";

import { groupsForIngredient, positionWeight } from "./actives";
import { rankProducts, scoreProduct, type ScorableProduct } from "./match";

const product = (
  id: string,
  inci: string[],
  canonicalCategory = "serum",
): ScorableProduct => ({
  id,
  canonicalCategory,
  ingredients: inci.map((inciName, i) => ({ inciName, position: i + 1 })),
});

describe("groupsForIngredient", () => {
  it("classifies retinoids by their many INCI spellings", () => {
    for (const name of [
      "retinol",
      "retinal",
      "retinyl palmitate",
      "hydroxypinacolone retinoate",
      "tretinoin",
      "adapalene",
    ]) {
      expect(groupsForIngredient(name)).toContain("retinoid");
    }
  });

  it("does NOT treat fatty alcohols as drying alcohol", () => {
    // Emollients. Flagging these would warn on most creams in the catalog.
    for (const name of ["cetyl alcohol", "cetearyl alcohol", "stearyl alcohol"]) {
      expect(groupsForIngredient(name)).not.toContain("drying_alcohol");
    }
    expect(groupsForIngredient("alcohol denat.")).toContain("drying_alcohol");
    expect(groupsForIngredient("sd alcohol 40-b")).toContain("drying_alcohol");
  });

  it("excludes citric acid from the AHA group", () => {
    // Overwhelmingly a pH adjuster at trace level; counting it as an
    // exfoliating acid would flag a large share of the catalog.
    expect(groupsForIngredient("citric acid")).not.toContain("aha");
    expect(groupsForIngredient("glycolic acid")).toContain("aha");
  });

  it("weights by INCI position, since that is concentration order", () => {
    expect(positionWeight(1)).toBeGreaterThan(positionWeight(8));
    expect(positionWeight(8)).toBeGreaterThan(positionWeight(25));
  });
});

describe("safety blocks", () => {
  it("blocks retinoids when pregnant or breastfeeding", () => {
    const res = scoreProduct(
      { pregnancyStatus: "pregnant_or_breastfeeding" },
      product("p", ["aqua", "glycerin", "retinol"]),
    );
    expect(res.blocked).toBe(true);
    expect(res.blockReasons[0].code).toBe("pregnancy_retinoid");
    expect(res.blockReasons[0].ingredients).toContain("retinol");
  });

  it("blocks a retinoid even at trace position", () => {
    // Position weight must NOT soften a safety rule.
    const inci = [...Array(24).fill("filler"), "retinol"];
    const res = scoreProduct({ pregnancyStatus: "pregnant_or_breastfeeding" }, product("p", inci));
    expect(res.blocked).toBe(true);
  });

  it("does not block when pregnancy status is not applicable", () => {
    const res = scoreProduct(
      { pregnancyStatus: "not_applicable" },
      product("p", ["aqua", "retinol"]),
    );
    expect(res.blocked).toBe(false);
  });

  it("does not block when the user preferred not to say", () => {
    // Declining to answer must not be treated as a "yes" — that would warn
    // people who never disclosed anything.
    const res = scoreProduct(
      { pregnancyStatus: "prefer_not_to_say" },
      product("p", ["aqua", "retinol"]),
    );
    expect(res.blocked).toBe(false);
  });

  it("blocks exfoliants and retinoids on recent isotretinoin", () => {
    const res = scoreProduct(
      { medications: ["isotretinoin"] },
      product("p", ["aqua", "glycolic acid"]),
    );
    expect(res.blocked).toBe(true);
    expect(res.blockReasons[0].code).toBe("isotretinoin_conflict");
  });

  it("blocks ingredients the user reported reacting to", () => {
    const res = scoreProduct(
      { reactions: ["fragrance"] },
      product("p", ["aqua", "glycerin", "parfum"]),
    );
    expect(res.blocked).toBe(true);
    expect(res.blockReasons[0].code).toBe("reaction_fragrance");
  });

  it("still returns a score for blocked products", () => {
    // Blocking is separate from ranking: the product page needs a score AND
    // the warning, since a user can reach it by search or a shared link.
    const res = scoreProduct(
      { pregnancyStatus: "pregnant_or_breastfeeding", agingConcern: "visible_wrinkles" },
      product("p", ["retinol", "glycerin"]),
    );
    expect(res.blocked).toBe(true);
    expect(res.score).toBeGreaterThan(0);
  });
});

describe("concern matching", () => {
  it("scores brightening actives higher for persistent pigmentation", () => {
    const p = product("p", ["aqua", "niacinamide", "glycerin"]);
    const strong = scoreProduct({ pigmentation: "persistent_spots" }, p);
    const mild = scoreProduct({ pigmentation: "occasional_marks" }, p);
    const none = scoreProduct({ pigmentation: "none" }, p);

    expect(strong.score).toBeGreaterThan(mild.score);
    expect(mild.score).toBeGreaterThan(none.score);
    expect(strong.reasons.some((r) => r.code === "brightening_match")).toBe(true);
  });

  it("weights a headline active above a trace one", () => {
    const headline = scoreProduct(
      { pigmentation: "persistent_spots" },
      product("a", ["aqua", "niacinamide"]),
    );
    const trace = scoreProduct(
      { pigmentation: "persistent_spots" },
      product("b", [...Array(22).fill("filler"), "niacinamide"]),
    );
    expect(headline.score).toBeGreaterThan(trace.score);
  });

  it("penalises fragrance for sensitive skin", () => {
    const withFragrance = scoreProduct(
      { sensitivity: "high" },
      product("a", ["aqua", "parfum"]),
    );
    const without = scoreProduct({ sensitivity: "high" }, product("b", ["aqua", "glycerin"]));
    expect(withFragrance.score).toBeLessThan(without.score);
    expect(withFragrance.reasons.some((r) => r.code === "fragrance_penalty")).toBe(true);
  });

  it("does not call non-fragrance ingredients fragrance", () => {
    // Regression: the INCIDecoder "perfuming" function tag is noisy in our
    // catalog and landed on caffeine and hexylene glycol, producing a false
    // "contains fragrance" claim. Fragrance is matched by curated name only.
    const res = scoreProduct(
      { sensitivity: "high" },
      {
        id: "p",
        canonicalCategory: "serum",
        ingredients: [
          { inciName: "aqua", position: 1, functions: ["solvent"] },
          { inciName: "caffeine", position: 2, functions: ["perfuming"] },
          { inciName: "hexylene glycol", position: 3, functions: ["perfuming"] },
        ],
      },
    );
    expect(res.reasons.some((r) => r.code === "fragrance_penalty")).toBe(false);
  });

  it("does not repeat an ingredient that matches several groups", () => {
    // squalane is both a barrier lipid and an emollient; "squalane, squalane"
    // as the evidence for a score reads as a bug.
    const res = scoreProduct(
      { skinType: "dry" },
      {
        id: "p",
        canonicalCategory: "moisturizer",
        ingredients: [
          { inciName: "squalane", position: 1, functions: ["emollient"] },
          { inciName: "glycerin", position: 2, functions: null },
        ],
      },
    );
    const reason = res.reasons.find((r) => r.code === "dry_skin_match");
    expect(reason).toBeDefined();
    expect(new Set(reason!.ingredients).size).toBe(reason!.ingredients.length);
  });

  it("does not double-count a flagged reaction as both block and penalty", () => {
    const res = scoreProduct(
      { sensitivity: "high", reactions: ["fragrance"] },
      product("p", ["aqua", "parfum"]),
    );
    expect(res.blocked).toBe(true);
    expect(res.reasons.some((r) => r.code === "fragrance_penalty")).toBe(false);
  });
});

describe("determinism and explainability", () => {
  it("returns identical output for identical input", () => {
    const profile = { skinType: "dry", sensitivity: "high", pigmentation: "persistent_spots" };
    const p = product("p", ["aqua", "niacinamide", "ceramide np", "parfum"]);
    expect(scoreProduct(profile, p)).toEqual(scoreProduct(profile, p));
  });

  it("every point of the score is attributable to a reason", () => {
    const res = scoreProduct(
      { skinType: "dry", pigmentation: "persistent_spots" },
      product("p", ["aqua", "niacinamide", "ceramide np"]),
    );
    const fromReasons = res.reasons.reduce((sum, r) => sum + r.points, 60);
    expect(res.score).toBe(Math.max(0, Math.min(100, fromReasons)));
  });

  it("clamps to 0-100", () => {
    const res = scoreProduct(
      {
        skinType: "dry",
        sensitivity: "high",
        pigmentation: "persistent_spots",
        agingConcern: "visible_wrinkles",
      },
      product("p", ["niacinamide", "retinol", "ceramide np", "centella asiatica extract"]),
    );
    expect(res.score).toBeLessThanOrEqual(100);
    expect(res.score).toBeGreaterThanOrEqual(0);
  });
});

describe("rankProducts", () => {
  const products = [
    product("plain", ["aqua", "glycerin"]),
    product("bright", ["aqua", "niacinamide", "alpha arbutin"]),
    product("unsafe", ["aqua", "retinol"]),
  ];

  it("orders by score and excludes blocked products by default", () => {
    const { ranked, total, blockedCount } = rankProducts(
      { pigmentation: "persistent_spots", pregnancyStatus: "pregnant_or_breastfeeding" },
      products,
    );
    expect(total).toBe(3);
    expect(blockedCount).toBe(1);
    expect(ranked.map((r) => r.product.id)).toEqual(["bright", "plain"]);
  });

  it("sinks blocked products last when they are included", () => {
    const { ranked } = rankProducts(
      { pigmentation: "persistent_spots", pregnancyStatus: "pregnant_or_breastfeeding" },
      products,
      { includeBlocked: true },
    );
    expect(ranked[ranked.length - 1].product.id).toBe("unsafe");
  });

  it("reports the true total so thin categories can be labelled honestly", () => {
    const { ranked, total } = rankProducts({}, products, { limit: 2 });
    expect(ranked).toHaveLength(2);
    expect(total).toBe(3);
  });
});
