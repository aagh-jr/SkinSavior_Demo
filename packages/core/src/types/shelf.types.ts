/**
 * Shared domain types for "My shelf".
 *
 * Data shape read by apps/web/src/lib/shelf-db.ts and rendered by the shelf
 * components. Kept here so visual components depend on the shared contract
 * rather than on the database module.
 */

export interface ShelfProduct {
  productId: string;
  slug: string | null;
  name: string;
  brand: string;
  imageUrl: string | null;
  category: string | null;
  /** Routine names this product appears in — empty for saved-only products. */
  usedIn: string[];
  savedAt: string | null;
  note: string | null;
}
