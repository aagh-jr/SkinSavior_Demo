// zod/v4 (bundled in zod 3.25+) — required by the Anthropic SDK's
// `zodOutputFormat` helper; the rest of the package stays on classic zod v3.
import { z } from "zod/v4";

import { CLAIM_BADGE_SLUGS } from "../research/claim-badges";

/**
 * Claude structured-output schemas shared by web and mobile.
 *
 * Every model response crosses a trust boundary — the API routes validate
 * against these before anything is written to the database or rendered.
 * The web app passes them to the SDK via `zodOutputFormat(...)` so the model
 * is constrained to this shape at generation time as well.
 */

// ---------------------------------------------------------------------------
// 1. Product extraction (URL-ingest pipeline)
// ---------------------------------------------------------------------------

export const extractedIngredientSchema = z.object({
  inci_name: z
    .string()
    .describe("INCI name exactly as listed, e.g. 'Sodium Hyaluronate'"),
  pct: z
    .string()
    .nullable()
    .describe("Concentration if stated on the page, e.g. '15%', else null"),
  is_key_active: z
    .boolean()
    .describe("True only for the headline actives the product is built around"),
  ingredient_function: z
    .string()
    .nullable()
    .describe("One-word role: humectant, antioxidant, preservative, solvent…"),
});

export const productExtractionSchema = z.object({
  is_product_page: z
    .boolean()
    .describe("False if the page is not a single skincare product page"),
  name: z.string().describe("Product name without the brand prefix"),
  brand: z.string(),
  category: z
    .string()
    .describe("One of: Cleanser, Toner, Essence, Serum, Moisturizer, Sunscreen, Mask, Exfoliant, Oil, Other"),
  origin: z
    .string()
    .nullable()
    .describe(
      "The brand's country of origin as a canonical English country name (e.g. 'South Korea', 'United States', 'France', 'Japan'). Determine it from your own knowledge of the brand, not only from what the page states. Use null only if you don't recognize the brand well enough to be confident.",
    ),
  description: z
    .string()
    .describe("Two neutral factual sentences. No marketing superlatives."),
  price: z.string().nullable().describe("Listed price with currency symbol"),
  claims: z
    .array(z.string())
    .describe("Marketing claims made on the page, verbatim and unevaluated"),
  ingredients: z
    .array(extractedIngredientSchema)
    .describe("Full ingredient list in the order printed"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Low if the ingredient list was missing or partially inferred"),
});

export type ProductExtraction = z.infer<typeof productExtractionSchema>;

// ---------------------------------------------------------------------------
// 2. Routine compatibility analysis
// ---------------------------------------------------------------------------

export const evidenceTierSchema = z
  .enum(["A", "B", "C", "D"])
  .describe(
    "A = multiple human RCTs; B = limited human trials; C = in-vitro/mechanistic only; D = anecdote or extrapolation",
  );

export const compatibilityFindingSchema = z.object({
  severity: z.enum(["minor", "major"]),
  ingredients_involved: z
    .array(z.string())
    .describe("INCI names from both the candidate product and the routine"),
  routine_step: z
    .string()
    .nullable()
    .describe("Name of the routine product involved, if one specifically"),
  explanation: z
    .string()
    .describe("Mechanism of the interaction in plain language"),
  who_is_affected: z
    .string()
    .describe("'everyone', 'sensitive skin', 'high concentrations only', etc."),
  recommendation: z
    .string()
    .describe("Concrete fix: alternate nights, AM/PM split, skip, patch test…"),
  evidence_tier: evidenceTierSchema,
});

export const compatibilityAnalysisSchema = z.object({
  verdict: z.enum(["no_clashes", "minor_clashes", "major_clashes"]),
  summary: z
    .string()
    .describe("One or two sentences a user can act on without reading findings"),
  findings: z.array(compatibilityFindingSchema),
});

export type CompatibilityAnalysis = z.infer<typeof compatibilityAnalysisSchema>;

// ---------------------------------------------------------------------------
// 3. Evidence Explainer study extraction (Stage-1 ingestion)
// ---------------------------------------------------------------------------

/**
 * A claim is sorted into a badge from the fixed vocabulary
 * (research/claim-badges.ts) — the model picks a bucket, it never writes claim
 * text or decides the compliance type; both live on the badge in code.
 */
export const studyClaimSchema = z
  .enum(CLAIM_BADGE_SLUGS)
  .describe(
    "The badge (fixed benefit bucket) this paper's finding belongs to. Pick by meaning, not wording; file disease findings (acne, rosacea, eczema, other conditions) under the studied-for-* badges.",
  );

export const studyExtractionSchema = z.object({
  is_relevant: z
    .boolean()
    .describe(
      "False if the abstract is not a usable study of this ingredient's effect on skin (e.g. a review of an unrelated topic, an editorial, or a different active).",
    ),
  design_level: z
    .enum(["1", "2", "3", "4", "5"])
    .describe(
      "CEBM 2011 design level. 1 = systematic review/meta-analysis of RCTs; 2 = individual randomized trial; 3 = non-randomized cohort/controlled study; 4 = case series/case-control; 5 = mechanism only (in vitro, ex vivo, animal). Use the PubMed publication types as a strong hint.",
    ),
  sample_size: z
    .number()
    .int()
    .nullable()
    .describe("Number of human participants if stated, else null. Never guess."),
  duration_weeks: z
    .number()
    .int()
    .nullable()
    .describe("Study duration in weeks if stated, else null."),
  population: z
    .string()
    .nullable()
    .describe("Who was studied, e.g. 'women with melasma', else null."),
  concentration: z
    .string()
    .nullable()
    .describe("Concentration of the active as tested, e.g. '5%', else null."),
  vehicle: z
    .string()
    .nullable()
    .describe("Formulation it was delivered in, e.g. 'cream', 'serum', else null."),
  outcome_measured: z
    .string()
    .nullable()
    .describe(
      "What was measured — a visible skin outcome ('clinical wrinkle grading') or a lab biomarker ('procollagen mRNA'). Be specific; this drives the indirectness downgrade.",
    ),
  effect_direction: z
    .enum(["positive", "null", "negative"])
    .nullable()
    .describe(
      "Direction of the main finding for the claim: positive = benefit, null = no significant effect, negative = worsened. null the enum only if the abstract states no direction.",
    ),
  effect_size: z
    .string()
    .nullable()
    .describe("Magnitude as reported, e.g. 'significant vs vehicle', 'large', else null."),
  funding_source: z
    .string()
    .nullable()
    .describe("Funder if stated, e.g. a company name or 'academic', else null."),
  conflict_flag: z
    .boolean()
    .describe("True if industry-funded or a conflict of interest is declared or evident."),
  extraction_confidence: z
    .enum(["high", "low"])
    .describe("Low when key fields had to be left null or the abstract was ambiguous."),
  claims: z
    .array(studyClaimSchema)
    .describe(
      "The badges this paper bears on — usually one. Empty only if is_relevant is false.",
    ),
});

export type StudyExtraction = z.infer<typeof studyExtractionSchema>;

// ---------------------------------------------------------------------------
// 4. Skin-log summarization (rolling per-user context block)
// ---------------------------------------------------------------------------

export const skinProfileSummarySchema = z.object({
  summary: z
    .string()
    .describe(
      "Dense third-person summary of observed patterns for use as prompt context: triggers, tolerated actives, reaction history with dates",
    ),
  suspected_triggers: z
    .array(z.string())
    .describe("Ingredients or products correlated with negative reactions"),
  tolerated_actives: z
    .array(z.string())
    .describe("Actives used repeatedly without reported reactions"),
  data_quality: z
    .enum(["sparse", "moderate", "rich"])
    .describe("How much weight downstream prompts should give this summary"),
});

export type SkinProfileSummary = z.infer<typeof skinProfileSummarySchema>;
