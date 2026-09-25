"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ProductIngredient } from "@skinsavior/core/types";

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

/**
 * The product decoder body from the "Full Product Page (Ship)" frame.
 *
 * Ingredients form a sticky index on the left. Selecting one updates the
 * analysis card in the long-form reading column without changing the order
 * printed on the label. Evidence and research arrive as slots so this visual
 * component stays independent of data access.
 */
export function ProductProfileSplit({
  ingredients,
  researchLabels,
  evidenceSlot,
  researchSlot,
  afterSlot,
}: {
  ingredients: ProductIngredient[];
  researchLabels: Set<string>;
  evidenceSlot?: ReactNode;
  researchSlot?: ReactNode;
  afterSlot?: ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const detail = ingredients[selectedIndex];
  const total = ingredients.length;
  const hasResearch = detail ? researchLabels.has(detail.name.toLowerCase()) : false;

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="m-0 font-serif text-[24px] font-medium leading-tight text-ink">
          Ingredients ({total})
        </h2>

        {ingredients.length > 0 ? (
          <p className="mt-5 text-[14px] font-medium leading-5 text-link">
            {ingredients.map((ingredient, index) => (
              <span key={`${ingredient.name}-${index}`}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  aria-pressed={selectedIndex === index}
                  className={
                    "rounded-sm text-left outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                    (selectedIndex === index ? "font-semibold text-ink" : "text-link")
                  }
                >
                  {ingredient.name}
                  {ingredient.pct ? ` ${ingredient.pct}` : ""}
                </button>
                {index < total - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        ) : (
          <p className="mt-4 text-[14px] leading-5 text-faint">
            No ingredient list on file for this product yet.
          </p>
        )}
      </aside>

      <div className="flex min-w-0 flex-col gap-11">
        <section aria-labelledby="ingredient-analysis-heading">
          <h2
            id="ingredient-analysis-heading"
            className="m-0 font-mono text-[14px] font-bold uppercase tracking-[0.07em] text-ink"
          >
            Ingredient analysis
          </h2>

          <div className="mt-4 rounded-xl border border-soft-tan bg-cream p-6 md:p-7">
            {detail ? (
              <>
                <h3 className="m-0 font-serif text-[32px] font-medium leading-tight text-ink">
                  {detail.name}
                </h3>
                <p className="mt-4 max-w-[76ch] text-[15px] leading-[1.6] text-ink">
                  This ingredient appears on the printed label. A researched description is coming;
                  for now, the profile shows its exact position and any function supplied with the
                  catalogue data.
                </p>

                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
                  <div className="flex gap-2">
                    <span className="text-faint">Position on label:</span>
                    <strong className="text-ink">
                      {ordinal(selectedIndex + 1)} of {total}
                    </strong>
                  </div>
                  {detail.tags[0] ? (
                    <div className="flex gap-2">
                      <span className="text-faint">Function:</span>
                      <strong className="text-link">{detail.tags[0].label}</strong>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 border-t border-soft-tan pt-4">
                  <Link
                    href={
                      hasResearch
                        ? "#research"
                        : `/ingredients?q=${encodeURIComponent(detail.name)}`
                    }
                    className="inline-flex rounded-lg border border-primary bg-white px-3.5 py-2.5 text-[13px] font-semibold text-link outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {hasResearch ? "Read the research" : "Look up this ingredient"}
                    <span aria-hidden="true" className="ml-1.5">
                      →
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <p className="m-0 text-[14px] text-faint">
                Ingredient analysis will appear when a complete INCI list is available.
              </p>
            )}
          </div>
        </section>

        {evidenceSlot}
        {researchSlot}
        {afterSlot}
      </div>
    </div>
  );
}
