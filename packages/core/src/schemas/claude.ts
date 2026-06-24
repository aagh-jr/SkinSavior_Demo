/**
 * STUB — Claude API response schemas (deferred).
 *
 * Per the current migration scope, the Claude integration is intentionally
 * left out of this pass; ingredient analysis is still served from static
 * data in the web app. When AI analysis is added later, define the Zod
 * schemas for Claude's structured output here (e.g. evidence-tiering,
 * per-ingredient verdicts) so every model response is validated before use.
 *
 * Suggested shape to flesh out later:
 *   export const ingredientAnalysisSchema = z.object({
 *     ingredient: z.string(),
 *     evidenceTier: z.enum(["A", "B", "C", "D"]),
 *     summary: z.string(),
 *     citations: z.array(z.object({ title: z.string(), url: z.string().url() })),
 *   });
 *   export type IngredientAnalysis = z.infer<typeof ingredientAnalysisSchema>;
 *
 * Intentionally empty for now to keep `@skinsavior/core/schemas` importable
 * without implying an integration exists.
 */

export {};
