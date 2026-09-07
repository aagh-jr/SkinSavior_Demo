"use server";

import {
  listDbProductsPage,
  PRODUCTS_PAGE_SIZE,
  type ProductsPage,
} from "@/lib/products-db";
import { scoreProductsForMe, type ProductMatch } from "@/lib/match-db";

export interface ProductsPageWithScores extends ProductsPage {
  /**
   * Per-slug match for the signed-in user, or null when there's no scorable
   * profile — the explorer hides the badge rather than show a number we can't
   * stand behind. Same contract as the product page's MatchScore panel.
   */
  scores: Record<string, ProductMatch> | null;
}

/**
 * Server action the products explorer calls when the user changes the type
 * filter, types a search, or clicks "Load more". Also scores the returned page
 * against the viewer's profile so each card can show a real match.
 */
export async function fetchProductsPage(params: {
  q: string;
  rawCategories: string[] | null;
  offset: number;
}): Promise<ProductsPageWithScores> {
  const page = await listDbProductsPage({
    q: params.q,
    rawCategories: params.rawCategories,
    offset: Math.max(0, params.offset | 0),
    limit: PRODUCTS_PAGE_SIZE,
  });
  const scores = await scoreProductsForMe(page.rows.map((r) => r.slug));
  return { ...page, scores };
}
