/**
 * Shared domain types for the brand index.
 *
 * Data shape read by apps/web/src/lib/brands-db.ts and rendered by the brand
 * components. Kept here so visual components depend on the shared contract
 * rather than on the database module.
 */

export interface BrandSummary {
  slug: string;
  name: string;
  origin: string | null;
  productCount: number;
  categories: string[]; // normalized display labels, deduped
  sampleImage: string | null;
}
