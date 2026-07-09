"use client";

import { useState } from "react";
import type { ResearchIngredient } from "@/lib/products-db";
import { IngredientResearch } from "./IngredientResearch";

/**
 * Product-page research section: a pill toggle over the product's researched
 * ingredients. Selecting one renders its research cards. Each ingredient's data
 * is fetched lazily on selection (IngredientResearch only mounts for the active
 * one), and TanStack Query keeps already-viewed ingredients cached.
 */
export function ProductResearch({ ingredients }: { ingredients: ResearchIngredient[] }) {
  const [activeId, setActiveId] = useState(ingredients[0]?.ingredientId);
  if (!ingredients.length) return null;

  return (
    <div>
      {ingredients.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing) => {
            const active = ing.ingredientId === activeId;
            return (
              <button
                key={ing.ingredientId}
                type="button"
                onClick={() => setActiveId(ing.ingredientId)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-[#9a4a2f] bg-[#9a4a2f] text-white"
                    : "border-[#e6ddcf] text-[#6b5f4f] hover:border-[#caa37f] hover:text-[#1d1812]"
                }`}
              >
                {ing.label}
              </button>
            );
          })}
        </div>
      )}
      <div className={ingredients.length > 1 ? "mt-5" : ""}>
        {activeId && <IngredientResearch key={activeId} ingredientId={activeId} />}
      </div>
    </div>
  );
}
