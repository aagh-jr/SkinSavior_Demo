"use client";

import { useQuery } from "@tanstack/react-query";
import type { Paper } from "@skinsavior/core/research";

export interface ResearchResponse {
  papers: Paper[];
  status: "ok" | "empty" | "error";
}

async function fetchResearch(ingredientId: string): Promise<ResearchResponse> {
  const res = await fetch(`/api/ingredients/${ingredientId}/research`);
  if (!res.ok) throw new Error(`Research request failed (HTTP ${res.status})`);
  return res.json();
}

/**
 * Data hook for an ingredient's cached PubMed papers. Uses the shared
 * react-query client (1h client cache; server caches for 30 days) so the
 * research card list stays presentational.
 */
export function useIngredientResearch(ingredientId: string) {
  return useQuery({
    queryKey: ["ingredient-research", ingredientId],
    queryFn: () => fetchResearch(ingredientId),
    staleTime: 1000 * 60 * 60, // 1h client cache; server caches for 30 days
    retry: 1,
  });
}
