/**
 * Shared domain types for skincare products and ingredients.
 *
 * Extracted from the web app's former `src/lib/products.ts`. The static
 * `products` array stays in the web app for now (UI mock data); these types
 * are the cross-platform contract. When Claude-backed analysis lands in a
 * later pass, the analysis output should be validated against the Zod
 * schemas in `@skinsavior/core/schemas` and conform to these types.
 */

export type Tone = "neutral" | "good" | "warn";

export interface IngredientTag {
  label: string;
  tone: Tone;
}

export interface ProductIngredient {
  name: string;
  pct?: string;
  tags: IngredientTag[];
}

export interface SafetyFact {
  label: string;
  value: string;
  tone: "good" | "warn";
}

export interface Retailer {
  name: string;
  price: string;
  highlight?: boolean;
}

export interface Review {
  author: string;
  profile: string;
  stars: string;
  text: string;
  color: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  origin: string;
  category: string;
  /** Product photo URL. Optional: static demo products and unenriched
   * catalog rows have none, in which case the category icon is shown. */
  imageUrl?: string | null;
  breadcrumb: string;
  tagline: string;
  description: string;
  price: string;
  retailerCount: number;
  match: number;
  matchFor: string;
  badges: string[];
  forYou: { good: string[]; warn: string[] };
  rank: string;
  evidenceGrade: string;
  evidenceText: string;
  ingredients: ProductIngredient[];
  safety: SafetyFact[];
  retailers: Retailer[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
}
