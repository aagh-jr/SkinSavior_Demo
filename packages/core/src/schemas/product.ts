import { z } from "zod";

/**
 * Runtime-validation schemas for skincare product/ingredient data.
 *
 * These mirror the types in `@skinsavior/core/types`. `z.infer` on these
 * schemas is type-compatible with those interfaces — validate any data
 * crossing a trust boundary (API responses, user input, future Claude
 * output) here before treating it as a `Product`.
 */

export const toneSchema = z.enum(["neutral", "good", "warn"]);

export const ingredientTagSchema = z.object({
  label: z.string(),
  tone: toneSchema,
});

export const productIngredientSchema = z.object({
  name: z.string(),
  pct: z.string().optional(),
  tags: z.array(ingredientTagSchema),
});

export const safetyFactSchema = z.object({
  label: z.string(),
  value: z.string(),
  tone: z.enum(["good", "warn"]),
});

export const retailerSchema = z.object({
  name: z.string(),
  price: z.string(),
  highlight: z.boolean().optional(),
});

export const reviewSchema = z.object({
  author: z.string(),
  profile: z.string(),
  stars: z.string(),
  text: z.string(),
  color: z.string(),
});

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  origin: z.string(),
  category: z.string(),
  breadcrumb: z.string(),
  tagline: z.string(),
  description: z.string(),
  price: z.string(),
  retailerCount: z.number(),
  match: z.number(),
  matchFor: z.string(),
  badges: z.array(z.string()),
  forYou: z.object({
    good: z.array(z.string()),
    warn: z.array(z.string()),
  }),
  rank: z.string(),
  evidenceGrade: z.string(),
  evidenceText: z.string(),
  ingredients: z.array(productIngredientSchema),
  safety: z.array(safetyFactSchema),
  retailers: z.array(retailerSchema),
  rating: z.number(),
  reviewCount: z.number(),
  reviews: z.array(reviewSchema),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductOutput = z.output<typeof productSchema>;
