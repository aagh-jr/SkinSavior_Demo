/**
 * Shared domain types for the ingredients catalog.
 *
 * Data shapes read by apps/web/src/lib/ingredients-db.ts and rendered by the
 * ingredients components. Kept here so visual components depend on the shared
 * contract rather than on the database module.
 */

export interface IngredientRow {
  id: string;
  inci_name: string;
  common_name: string | null;
  functions?: string[] | null;
  description: string | null;
  safety_notes: string | null;
}

export interface IngredientPage {
  rows: IngredientRow[];
  total: number;
  hasMore: boolean;
}
