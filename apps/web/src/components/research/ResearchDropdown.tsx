"use client";

import { useState } from "react";
import type { ResearchIngredient } from "@/lib/products-db";
import { ProductResearch } from "./ProductResearch";

/**
 * Collapsible wrapper for the product-page research section. Collapsed by
 * default — a plus reveals it, a minus hides it again — so the papers sit
 * quietly at the bottom of the profile until asked for. Keeps id="research"
 * (the ingredient decoder's "read the research" link scrolls here); expanding
 * on demand is fine because the anchor still lands on the header.
 */
export function ResearchDropdown({ ingredients }: { ingredients: ResearchIngredient[] }) {
  const [open, setOpen] = useState(false);
  if (!ingredients.length) return null;

  return (
    <div id="research" className="mt-10 scroll-mt-24 border-t border-soft-tan pt-9">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-soft-tan bg-cream font-mono text-[20px] leading-none text-clay-strong"
        >
          {open ? "−" : "+"}
        </span>
        <span className="font-mono text-[26px] font-medium text-ink">The research</span>
      </button>
      {open && (
        <div className="mt-4">
          <div className="mb-4 text-[13px] text-faint">
            Top PubMed papers
            {ingredients.length > 1 ? " — pick an ingredient" : ""}. Titles link to the source.
          </div>
          <ProductResearch ingredients={ingredients} />
        </div>
      )}
    </div>
  );
}
