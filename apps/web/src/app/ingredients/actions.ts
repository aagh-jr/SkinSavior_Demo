"use server";

import { listIngredients } from "@/lib/ingredients-db";
import type { IngredientPage } from "@skinsavior/core/types";
import { INGREDIENTS_PAGE_SIZE } from "@/lib/ingredient-filters";

/**
 * Server action the ingredients explorer calls to load a page of results when
 * the user changes a filter, types a search, or clicks "Load more".
 */
export async function fetchIngredientsPage(params: {
  q: string;
  offset: number;
}): Promise<IngredientPage> {
  return listIngredients({
    q: params.q,
    offset: Math.max(0, params.offset | 0),
    limit: INGREDIENTS_PAGE_SIZE,
  });
}
