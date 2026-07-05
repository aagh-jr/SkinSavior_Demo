// zod/v4 (bundled in zod 3.25+) — required by the Anthropic SDK's
// `zodOutputFormat` helper; the rest of the package stays on classic zod v3.
import { z } from "zod/v4";

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
  origin: z.string().nullable().describe("Country of the brand if stated"),
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
// 3. Skin-log summarization (rolling per-user context block)
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
