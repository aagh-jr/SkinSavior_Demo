"use client";

import { useEffect, useState } from "react";

/** A catalog product hit from /api/products/search (keyed by id for the picker). */
export interface ProductSearchHit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
}

export interface ProductSearchState {
  hits: ProductSearchHit[];
  searching: boolean;
}

/**
 * Data hook for the routine builder's product picker. Debounces the query and
 * calls /api/products/search (the same endpoint the SiteNav typeahead uses),
 * owning the results/loading state so the picker stays presentational.
 */
export function useProductSearch(q: string): ProductSearchState {
  const [hits, setHits] = useState<ProductSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (res.ok) setHits((await res.json()).results ?? []);
        setSearching(false);
      } catch {
        // aborted or offline — keep whatever we had
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  return { hits, searching };
}
