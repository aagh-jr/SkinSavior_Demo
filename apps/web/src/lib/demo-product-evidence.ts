import {
  CERTAINTY_META,
  CLAIM_BADGES,
  DESIGN_TIER_LABELS,
  type Paper,
} from "@skinsavior/core/research";
import type { EvidenceClaim, EvidenceStudy, ResearchIngredient } from "@skinsavior/core/types";

/**
 * Source-checked content for the static product-page design fixture.
 *
 * The demo is intentionally kept outside the product record: its evidence is
 * not a substitute for the graded claims stored in Supabase for real products.
 * Each claim names its formulation-level limitation so the page never implies
 * that a result from a multi-ingredient formula belongs to one ingredient.
 */
const studies: EvidenceStudy[] = [
  {
    paperRef: "18492135",
    title:
      "Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin",
    designLevel: "2",
    tierLabel: DESIGN_TIER_LABELS["2"],
    href: "https://pubmed.ncbi.nlm.nih.gov/18492135/",
  },
  {
    paperRef: "22206073",
    title:
      "Two randomized, controlled, comparative studies of the stratum corneum integrity benefits of niacinamide/glycerin body moisturizers",
    designLevel: "2",
    tierLabel: DESIGN_TIER_LABELS["2"],
    href: "https://pubmed.ncbi.nlm.nih.gov/22206073/",
  },
  {
    paperRef: "19845667",
    title:
      "Reduction in the appearance of facial hyperpigmentation after use of moisturizers with topical niacinamide and N-acetyl glucosamine",
    designLevel: "2",
    tierLabel: DESIGN_TIER_LABELS["2"],
    href: "https://pubmed.ncbi.nlm.nih.gov/19845667/",
  },
];

const makeClaim = (
  id: string,
  badgeSlug: "evens-tone" | "hydrates" | "supports-barrier",
  certainty: "moderate" | "limited",
  supportingStudies: EvidenceStudy[],
  explainer: string,
): EvidenceClaim => {
  const badge = CLAIM_BADGES[badgeSlug];
  const meta = CERTAINTY_META[certainty];
  return {
    id,
    ingredientId: "demo-niacinamide",
    ingredientName: "Niacinamide",
    badgeSlug,
    badgeLabel: badge.label,
    claimText: badge.cardText,
    claimType: badge.type,
    certainty,
    label: meta.label,
    notches: meta.notches,
    reasons: [
      {
        code: "formulation_evidence",
        direction: "down",
        text: "The available study evaluated a finished formula, not this product on its own.",
      },
    ],
    studyCount: supportingStudies.length,
    studies: supportingStudies,
    explainer,
  };
};

const papers: Paper[] = [
  {
    pmid: "18492135",
    title:
      "Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin",
    abstract:
      "A 12-week double-blind, placebo-controlled split-face trial tested a moisturizer containing 5% niacinamide in 50 participants. The paper reports improvements in several appearance endpoints versus the control moisturizer.",
    journal: "International Journal of Cosmetic Science",
    year: 2008,
    publication_types: ["Randomized Controlled Trial"],
    doi: null,
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/18492135/",
    rank: 1,
  },
  {
    pmid: "22206073",
    title:
      "Two randomized, controlled, comparative studies of the stratum corneum integrity benefits of niacinamide/glycerin body moisturizers",
    abstract:
      "Two 35-day randomized studies compared niacinamide/glycerin moisturizers with other moisturizers and no treatment. Hydration and transepidermal water loss were measured, but the result belongs to the full formulas rather than a single ingredient.",
    journal: "Journal of Drugs in Dermatology",
    year: 2012,
    publication_types: ["Randomized Controlled Trial"],
    doi: null,
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/22206073/",
    rank: 2,
  },
  {
    pmid: "19845667",
    title:
      "Reduction in the appearance of facial hyperpigmentation after use of moisturizers with topical niacinamide and N-acetyl glucosamine",
    abstract:
      "A 10-week double-blind, vehicle-controlled trial evaluated a regimen containing 4% niacinamide and 2% N-acetyl glucosamine. Because both actives were used together, the result cannot be assigned to niacinamide alone.",
    journal: "British Journal of Dermatology",
    year: 2010,
    publication_types: ["Randomized Controlled Trial"],
    doi: "10.1111/j.1365-2133.2009.09477.x",
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/19845667/",
    rank: 3,
  },
];

const evidence = [
  makeClaim(
    "demo-even-tone",
    "evens-tone",
    "moderate",
    [studies[0], studies[2]],
    "Controlled trials found improvements in the appearance of uneven tone. One study tested 5% niacinamide directly; another tested niacinamide with N-acetyl glucosamine, so the combined-formula result is kept separate in the evidence grade.",
  ),
  makeClaim(
    "demo-hydration",
    "hydrates",
    "limited",
    [studies[1]],
    "A randomized study measured hydration in niacinamide/glycerin moisturizers. It supports the finished-formula result, but cannot isolate the contribution of this serum's individual ingredients.",
  ),
  makeClaim(
    "demo-barrier",
    "supports-barrier",
    "limited",
    [studies[1]],
    "The same randomized moisturizer studies measured transepidermal water loss, a barrier-related outcome. Their multi-ingredient design limits how specifically the finding applies here.",
  ),
];

const researchIngredients: ResearchIngredient[] = [
  { ingredientId: "demo-niacinamide", label: "Niacinamide" },
];

export interface DemoProductEvidence {
  evidence: EvidenceClaim[];
  papers: Paper[];
  researchIngredients: ResearchIngredient[];
}

/** Content only for /product/demo-barrier-serum when design mode has no database. */
export function getDemoProductEvidence(slug: string): DemoProductEvidence | null {
  if (slug !== "demo-barrier-serum") return null;
  return { evidence, papers, researchIngredients };
}
