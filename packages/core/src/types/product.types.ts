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

// ---------------------------------------------------------------------------
// Catalog / browse view types.
//
// Data shapes returned by the product data layer (apps/web/src/lib/products-db.ts)
// and consumed by visual components. Kept here so components depend on the
// shared contract rather than on the database module.
// ---------------------------------------------------------------------------

/** One product's research-pilot ingredient, driving the product-page toggle. */
export interface ResearchIngredient {
  ingredientId: string;
  /** Display label for the toggle pill. */
  label: string;
}

/** A browse-filter chip: a normalized product category and its coverage. */
export interface ProductCategory {
  key: string;
  label: string;
  /** Raw `products.category` values that normalize to this key. */
  rawValues: string[];
  count: number;
}

/** A single catalog card row (raw column shape, snake_case from the DB). */
export interface ProductCardRow {
  slug: string;
  name: string;
  brand: string;
  origin: string | null;
  category: string | null;
  price: string | null;
  image_url: string | null;
}

/** One page of catalog cards plus paging metadata. */
export interface ProductsPage {
  rows: ProductCardRow[];
  total: number;
  hasMore: boolean;
}
