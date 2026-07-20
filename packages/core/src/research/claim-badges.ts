/**
 * The fixed benefit vocabulary for Evidence Explainer claims ("badges").
 *
 * A claim is an (ingredient, badge) pair — never free text. The Stage-1
 * extractor sorts each paper's finding into one of these buckets via a schema
 * enum, so two papers describing the same benefit in different words resolve
 * to the same claim and stack as evidence, instead of accumulating
 * near-duplicate claims per ingredient.
 *
 * Each badge also fixes the claim's compliance type (docs/claims-policy.md):
 * the LLM never decides whether a claim is safe to render — the bucket already
 * knows. The `prohibited` badges exist so disease findings (an acne trial)
 * have somewhere to be filed as provenance; the read layer never surfaces them.
 *
 * This list is the product's claim vocabulary. Adding a badge is a deliberate
 * act: extend CLAIM_BADGE_SLUGS + CLAIM_BADGES here AND relax the check
 * constraint on claims.badge_slug (a new supabase migration).
 */

export type ClaimBadgeType = "cosmetic" | "borderline" | "prohibited";

export interface ClaimBadge {
  /** Short chip label shown on the claim card, e.g. "Evens tone". */
  label: string;
  /** Consumer-facing card headline. Never rendered for prohibited badges. */
  cardText: string;
  /** Compliance type (docs/claims-policy.md). Fixed by the badge, not the LLM. */
  type: ClaimBadgeType;
  /** What findings belong in this bucket — extractor prompt guidance only. */
  hint: string;
}

export const CLAIM_BADGE_SLUGS = [
  "evens-tone",
  "brightens",
  "smooths-wrinkles",
  "firms",
  "hydrates",
  "smooths-texture",
  "minimizes-pores",
  "controls-oil",
  "reduces-redness",
  "soothes",
  "supports-barrier",
  "antioxidant",
  "supports-collagen",
  "studied-for-acne",
  "studied-for-rosacea",
  "studied-for-eczema",
  "studied-for-other-condition",
] as const;

export type ClaimBadgeSlug = (typeof CLAIM_BADGE_SLUGS)[number];

export const CLAIM_BADGES: Record<ClaimBadgeSlug, ClaimBadge> = {
  "evens-tone": {
    label: "Evens tone",
    cardText: "Helps even the look of uneven tone and dark spots",
    type: "cosmetic",
    hint: "uneven tone, dark spots, hyperpigmentation or melasma measured as visible appearance",
  },
  brightens: {
    label: "Brightens",
    cardText: "Helps brighten a dull-looking complexion",
    type: "cosmetic",
    hint: "radiance, luminosity, dullness",
  },
  "smooths-wrinkles": {
    label: "Smooths wrinkles",
    cardText: "Helps soften the look of fine lines and wrinkles",
    type: "cosmetic",
    hint: "wrinkle depth or count, fine lines, photoaged or generally aged appearance",
  },
  firms: {
    label: "Firms",
    cardText: "Helps skin look firmer and more lifted",
    type: "cosmetic",
    hint: "firmness, elasticity, sagging appearance",
  },
  hydrates: {
    label: "Hydrates",
    cardText: "Helps skin look and feel more hydrated",
    type: "cosmetic",
    hint: "hydration, moisturization, dryness, TEWL used as a moisturization endpoint",
  },
  "smooths-texture": {
    label: "Smooths texture",
    cardText: "Helps refine the look of rough or uneven texture",
    type: "cosmetic",
    hint: "roughness, texture or smoothness endpoints distinct from wrinkles",
  },
  "minimizes-pores": {
    label: "Minimizes pores",
    cardText: "Helps minimize the look of enlarged pores",
    type: "cosmetic",
    hint: "pore size or visibility",
  },
  "controls-oil": {
    label: "Controls oil",
    cardText: "Helps reduce excess shine and oiliness",
    type: "cosmetic",
    hint: "sebum production, shine, oiliness",
  },
  "reduces-redness": {
    label: "Reduces redness",
    cardText: "Helps reduce the look of redness",
    type: "borderline",
    hint: "erythema or visible redness outside a named disease context",
  },
  soothes: {
    label: "Soothes",
    cardText: "Helps calm and soothe the skin",
    type: "borderline",
    hint: "irritation, stinging, sensitivity, calming",
  },
  "supports-barrier": {
    label: "Supports barrier",
    cardText: "Supports the skin's moisture barrier",
    type: "borderline",
    hint: "barrier function, ceramides, TEWL used as a barrier endpoint",
  },
  antioxidant: {
    label: "Antioxidant",
    cardText: "Provides antioxidant support against environmental stress",
    type: "borderline",
    hint: "oxidative stress, free radicals, UV-induced damage markers",
  },
  "supports-collagen": {
    label: "Supports collagen",
    cardText: "Supports the skin's collagen",
    type: "borderline",
    hint: "collagen or procollagen production, elastin markers",
  },
  "studied-for-acne": {
    label: "Acne (research only)",
    cardText: "Studied in the context of acne",
    type: "prohibited",
    hint: "acne, comedones, blemishes treated as a medical condition",
  },
  "studied-for-rosacea": {
    label: "Rosacea (research only)",
    cardText: "Studied in the context of rosacea",
    type: "prohibited",
    hint: "rosacea and its symptoms",
  },
  "studied-for-eczema": {
    label: "Eczema (research only)",
    cardText: "Studied in the context of eczema",
    type: "prohibited",
    hint: "eczema, atopic dermatitis",
  },
  "studied-for-other-condition": {
    label: "Other condition (research only)",
    cardText: "Studied in the context of a medical skin condition",
    type: "prohibited",
    hint: "any other disease or medical condition — psoriasis, dermatitis, wound healing, scarring, infections",
  },
};
