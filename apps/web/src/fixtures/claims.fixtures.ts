/**
 * Fake Evidence Explainer claims for Storybook, typed against EvidenceClaim.
 *
 * Covers every certainty tier the grading engine produces
 * (strong / moderate / limited / very_limited) using the real CERTAINTY_META
 * labels + notches and DESIGN_TIER_LABELS study tags. Only cosmetic/borderline
 * badges appear — no disease-treatment claims (docs/claims-policy.md).
 */
import type { EvidenceClaim, EvidenceStudy } from "@skinsavior/core/types";
import { CERTAINTY_META, DESIGN_TIER_LABELS } from "@skinsavior/core/research";
import { CLAIM_BADGES } from "@skinsavior/core/research";
import type { Certainty } from "@skinsavior/core/research";

const study = (
  over: Partial<EvidenceStudy> & Pick<EvidenceStudy, "paperRef" | "title" | "designLevel">,
): EvidenceStudy => ({
  tierLabel: DESIGN_TIER_LABELS[over.designLevel],
  href: "https://pubmed.ncbi.nlm.nih.gov/",
  ...over,
});

/** Build a claim, filling label/notches from the real certainty metadata. */
function claim(
  id: string,
  ingredientId: string,
  ingredientName: string,
  badgeSlug: keyof typeof CLAIM_BADGES,
  certainty: Certainty,
  parts: {
    reasons: EvidenceClaim["reasons"];
    studies: EvidenceStudy[];
    explainer?: string | null;
  },
): EvidenceClaim {
  const badge = CLAIM_BADGES[badgeSlug];
  const meta = CERTAINTY_META[certainty];
  return {
    id,
    ingredientId,
    ingredientName,
    badgeSlug,
    badgeLabel: badge.label,
    claimText: badge.cardText,
    claimType: badge.type,
    certainty,
    label: meta.label,
    notches: meta.notches,
    reasons: parts.reasons,
    studyCount: parts.studies.length,
    studies: parts.studies,
    explainer: parts.explainer ?? null,
  };
}

/** STRONG — multiple randomized trials, consistent direction. */
export const strongClaim = claim(
  "claim-niacinamide-oil",
  "ing-niacinamide",
  "Niacinamide",
  "controls-oil",
  "strong",
  {
    reasons: [
      { code: "rct_present", direction: "up", text: "Backed by more than one randomized trial." },
      { code: "consistency", direction: "up", text: "Studies point the same way." },
    ],
    studies: [
      study({ paperRef: "PMID:16766489", title: "Topical niacinamide and sebum output", designLevel: "2", href: "https://pubmed.ncbi.nlm.nih.gov/16766489/" }),
      study({ paperRef: "PMID:16536414", title: "Niacinamide for facial oiliness: a controlled study", designLevel: "2" }),
      study({ paperRef: "PMID:21128815", title: "Review of niacinamide in cosmetic dermatology", designLevel: "1" }),
    ],
    explainer:
      "Across several controlled studies, topical niacinamide reduced measured oil output and the look of shine, and the studies agreed with one another. That consistency is why the evidence here reads as strong.",
  },
);

/** MODERATE — a randomized trial, but on a biomarker / smaller sample. */
export const moderateClaim = claim(
  "claim-vitc-antioxidant",
  "ing-ascorbic-acid",
  "Vitamin C",
  "antioxidant",
  "moderate",
  {
    reasons: [
      { code: "rct_present", direction: "up", text: "Supported by a randomized trial." },
      { code: "indirectness", direction: "down", text: "Some outcomes were lab markers, not visible skin changes." },
    ],
    studies: [
      study({ paperRef: "PMID:12technic", title: "Ascorbic acid and UV-induced oxidative markers", designLevel: "2" }),
      study({ paperRef: "PMID:34antiox", title: "Antioxidant activity of stabilized vitamin C serums", designLevel: "3" }),
    ],
    explainer:
      "A randomized trial supports the antioxidant framing, but several endpoints were laboratory markers rather than a visible change in the skin, which holds the certainty at moderate.",
  },
);

/** LIMITED — small studies, mostly lower-tier designs. */
export const limitedClaim = claim(
  "claim-ha-hydrates",
  "ing-sodium-hyaluronate",
  "Hyaluronic Acid",
  "hydrates",
  "limited",
  {
    reasons: [
      { code: "small_sample", direction: "down", text: "The studies were small." },
      { code: "design", direction: "neutral", text: "Mostly cohort-level evidence." },
    ],
    studies: [
      study({ paperRef: "PMID:19hydrate", title: "Hyaluronic acid and short-term skin hydration", designLevel: "3" }),
      study({ paperRef: "PMID:22cohort", title: "Humectant hydration: a small cohort", designLevel: "3" }),
    ],
    explainer: null,
  },
);

/** VERY LIMITED — a single lab study; a floor grade. */
export const veryLimitedClaim = claim(
  "claim-panthenol-barrier",
  "ing-panthenol",
  "Panthenol",
  "supports-barrier",
  "very_limited",
  {
    reasons: [
      { code: "single_lab", direction: "floor", text: "Based on a single lab study." },
    ],
    studies: [
      study({ paperRef: "PMID:20labonly", title: "Panthenol effect on a barrier marker in vitro", designLevel: "5" }),
    ],
    explainer: null,
  },
);

/** Long-explainer case — checks card overflow and clamping. */
export const longExplainerClaim = claim(
  "claim-retinol-wrinkles",
  "ing-retinol",
  "Retinol",
  "smooths-wrinkles",
  "moderate",
  {
    reasons: [
      { code: "rct_present", direction: "up", text: "Supported by randomized trials." },
      { code: "consistency", direction: "up", text: "Findings are broadly consistent." },
      { code: "small_sample", direction: "down", text: "Several trials were small." },
    ],
    studies: [
      study({ paperRef: "PMID:17wrink1", title: "Topical retinol and periorbital fine lines", designLevel: "2" }),
      study({ paperRef: "PMID:18wrink2", title: "Retinol vs vehicle for photoaged appearance", designLevel: "2" }),
      study({ paperRef: "PMID:15review", title: "Retinoids in cosmetic dermatology: a systematic review", designLevel: "1" }),
    ],
    explainer:
      "Multiple randomized trials report that topical retinol softens the appearance of fine lines over 8–12 weeks of nightly use, and a systematic review pulls the same direction. Several of the individual trials were small and industry-adjacent, and results vary with concentration and formulation, so the overall certainty lands at moderate rather than strong. In practice this means the appearance benefit is reasonably well supported but not guaranteed for everyone, and results build slowly — this is an evening product, and daytime sun protection matters while using it.",
  },
);

export const claims: EvidenceClaim[] = [
  strongClaim,
  moderateClaim,
  limitedClaim,
  veryLimitedClaim,
  longExplainerClaim,
];
