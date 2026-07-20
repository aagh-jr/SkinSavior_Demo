import { describe, expect, it } from "vitest";

import { CLAIM_BADGES, CLAIM_BADGE_SLUGS } from "./claim-badges";

// The catalog is the product's claim vocabulary AND its compliance boundary
// (docs/claims-policy.md), so its invariants get pinned here.
describe("claim badge catalog", () => {
  it("has unique slugs and an entry for every slug", () => {
    expect(new Set(CLAIM_BADGE_SLUGS).size).toBe(CLAIM_BADGE_SLUGS.length);
    for (const slug of CLAIM_BADGE_SLUGS) {
      const badge = CLAIM_BADGES[slug];
      expect(badge.label).toBeTruthy();
      expect(badge.cardText).toBeTruthy();
      expect(badge.hint).toBeTruthy();
    }
  });

  it("keeps cosmetic card copy framed as appearance, not efficacy", () => {
    for (const slug of CLAIM_BADGE_SLUGS) {
      const badge = CLAIM_BADGES[slug];
      if (badge.type !== "cosmetic") continue;
      // Policy: cosmetic phrasing hedges ("Helps …") and speaks to how skin
      // looks/feels, never to what the product does to the body.
      expect(badge.cardText).toMatch(/^Helps /);
    }
  });

  it("marks every disease bucket prohibited and names it as research-only", () => {
    for (const slug of CLAIM_BADGE_SLUGS.filter((s) => s.startsWith("studied-for-"))) {
      expect(CLAIM_BADGES[slug].type).toBe("prohibited");
    }
    for (const slug of CLAIM_BADGE_SLUGS) {
      if (CLAIM_BADGES[slug].type === "prohibited") {
        expect(slug.startsWith("studied-for-")).toBe(true);
      }
    }
  });
});
