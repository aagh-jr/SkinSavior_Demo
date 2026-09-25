"use server";

import { listDbProductsPage, PRODUCTS_PAGE_SIZE } from "@/lib/products-db";
import type { ProductsPage } from "@skinsavior/core/types";

/**
 * Server action the products explorer calls when the user changes the type
 * filter, types a search, or clicks "Load more".
 */
export async function fetchProductsPage(params: {
  q: string;
  rawCategories: string[] | null;
  offset: number;
}): Promise<ProductsPage> {
  return listDbProductsPage({
    q: params.q,
    rawCategories: params.rawCategories,
    offset: Math.max(0, params.offset | 0),
    limit: PRODUCTS_PAGE_SIZE,
  });
}
