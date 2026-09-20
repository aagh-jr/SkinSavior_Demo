"use client";

import { useEffect, useState } from "react";

export interface DbHit {
  slug: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string | null;
}

export interface IngredientHit {
  id: string;
  name: string;
}

export type SearchMode = "products" | "ingredients";

export type SearchStatus = "idle" | "loading" | "error";

export interface SearchState {
  dbHits: DbHit[];
  ingredientResults: IngredientHit[];
  status: SearchStatus;
  /** Re-run the current query after an error. */
  retry: () => void;
}

/**
 * Data hook for the global typeahead. Debounces the query, calls
 * /api/{mode}/search, and owns the results/loading/error state so the search
 * component stays presentational. UI concerns (open state, focus, navigation)
 * remain in the component.
 */
export function useSearch(q: string, mode: SearchMode): SearchState {
  const [ingredientResults, setIngredientResults] = useState<IngredientHit[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [dbHits, setDbHits] = useState<DbHit[]>([]);

  useEffect(() => {
    const needle = q.trim();
    setDbHits([]);
    setIngredientResults([]);
    if (!needle) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/${mode}/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search unavailable");
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (mode === "products") setDbHits(data.results ?? []);
        else setIngredientResults(data.results ?? []);
        setStatus("idle");
      } catch {
        if (!controller.signal.aborted) setStatus("error");
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, mode, retryCount]);

  return {
    dbHits,
    ingredientResults,
    status,
    retry: () => setRetryCount((n) => n + 1),
  };
}
