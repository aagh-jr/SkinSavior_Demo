/**
 * Fake research data for Storybook: PubMed papers (the /api/ingredients/[id]/
 * research response) and pending studies for the /review queue. Typed against
 * the real Paper and PendingStudy contracts.
 */
import type { Paper } from "@skinsavior/core/research";
import type { PendingStudy } from "@skinsavior/core/types";
import type { ResearchResponse } from "@/hooks/useIngredientResearch";

export const papers: Paper[] = [
  {
    pmid: "16766489",
    title: "Topical niacinamide reduces sebum excretion rate in a controlled study",
    abstract:
      "A randomized, vehicle-controlled study of 2% niacinamide applied for four weeks reported a measurable reduction in sebum excretion rate versus vehicle.",
    journal: "Journal of Cosmetic Dermatology",
    year: 2006,
    publication_types: ["Randomized Controlled Trial"],
    doi: "10.1111/j.1473-2165.2006.00269.x",
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/16766489/",
    rank: 1,
  },
  {
    pmid: "21128815",
    title: "Niacinamide in cosmetic dermatology: a review",
    abstract:
      "A narrative review summarizing cosmetic applications of topical niacinamide, including oil control and the appearance of pores and uneven tone.",
    journal: "Dermatologic Surgery",
    year: 2010,
    publication_types: ["Review"],
    doi: null,
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/21128815/",
    rank: 2,
  },
  {
    pmid: "16536414",
    title: "Facial oiliness and topical niacinamide: a controlled clinical trial",
    abstract: null,
    journal: "International Journal of Dermatology",
    year: 2006,
    publication_types: ["Controlled Clinical Trial"],
    doi: null,
    pubmed_url: "https://pubmed.ncbi.nlm.nih.gov/16536414/",
    rank: 3,
  },
];

export const researchOk: ResearchResponse = { papers, status: "ok" };
export const researchEmpty: ResearchResponse = { papers: [], status: "empty" };
export const researchError: ResearchResponse = { papers: [], status: "error" };

export const pendingStudies: PendingStudy[] = [
  {
    id: "pending-1",
    paperRef: "PMID:39123456",
    title: "Topical panthenol and barrier recovery after tape-stripping",
    ingredientName: "Panthenol",
    tierLabel: "Randomized trial",
    sampleSize: 42,
    effectDirection: "positive",
    concentration: "5%",
    outcomeMeasured: "TEWL recovery",
    fundingSource: "University grant",
    conflictFlag: false,
    extractionConfidence: "high",
    ingestedAt: "2026-09-18T10:00:00.000Z",
    impacts: [
      {
        claimId: "claim-panthenol-barrier",
        badgeSlug: "supports-barrier",
        badgeLabel: "Supports barrier",
        currentLabel: "Very limited evidence",
        wouldBecomeLabel: "Limited evidence",
        flips: true,
      },
    ],
  },
  {
    id: "pending-2",
    paperRef: "PMID:39222333",
    title: "Industry-sponsored trial of a niacinamide serum for shine",
    ingredientName: "Niacinamide",
    tierLabel: "Randomized trial",
    sampleSize: 24,
    effectDirection: "positive",
    concentration: "4%",
    outcomeMeasured: "Sebum / shine",
    fundingSource: "Manufacturer",
    conflictFlag: true,
    extractionConfidence: "medium",
    ingestedAt: "2026-09-19T14:30:00.000Z",
    impacts: [
      {
        claimId: "claim-niacinamide-oil",
        badgeSlug: "controls-oil",
        badgeLabel: "Controls oil",
        currentLabel: "Strong evidence",
        wouldBecomeLabel: "Strong evidence",
        flips: false,
      },
    ],
  },
];
