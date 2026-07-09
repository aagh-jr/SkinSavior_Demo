import { z } from "zod";

/**
 * One research paper as surfaced by the ingredient-research feature. Shape
 * mirrors files/ingredient-research-spec.md section 3 and the `research_papers`
 * table. Populated from PubMed metadata only — no LLM classification.
 */
export const paperSchema = z.object({
  pmid: z.string(),
  title: z.string(),
  abstract: z.string().nullable(),
  journal: z.string().nullable(),
  year: z.number().int().nullable(),
  /** Straight from PubMed's PublicationType fields; drives the study-type badge. */
  publication_types: z.array(z.string()),
  doi: z.string().nullable(),
  pubmed_url: z.string(),
  /** 1..5, preserving PubMed's relevance order for display. */
  rank: z.number().int(),
});

export type Paper = z.infer<typeof paperSchema>;
