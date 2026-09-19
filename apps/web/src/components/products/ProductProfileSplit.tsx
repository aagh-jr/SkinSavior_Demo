"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ProductIngredient } from "@skinsavior/core/types";

/**
 * Product Profile — the shared 4:6 editorial split (Paper "Product Profile —
 * Snail Mucin (proto)"). The top row is intentionally open between the image
 * and summary; below one vertical hairline joins the full-width horizontal
 * rule, creating a clean "+" grid for the analysis and ingredient list.
 *
 * Interactive: clicking an ingredient in the right-hand list opens its
 * breakdown in the left-hand spotlight card — so the two halves share one
 * `sel` state, which is why the whole split is one client component. The
 * server-rendered image and summary are passed in as slots, keeping their
 * data-fetching on the server.
 *
 * The spotlight panel states only what the label holds: ingredient name,
 * printed position, and percentage when the source provides one. It does not
 * derive a profile verdict from display tags or invent pharmacology prose.
 */

const ORDINALS = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
];
function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

export function ProductProfileSplit({
  imageSlot,
  summarySlot,
  ingredients,
  researchLabels,
}: {
  imageSlot: ReactNode;
  summarySlot: ReactNode;
  ingredients: ProductIngredient[];
  researchLabels: Set<string>;
}) {
  const [sel, setSel] = useState(0);
  const detail = ingredients[sel];
  const total = ingredients.length;
  const hasResearch = detail ? researchLabels.has(detail.name.toLowerCase()) : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[4fr_6fr]">
      {/* TOP ROW — image and summary share a baseline, without a vertical rule */}
      <div className="flex justify-center md:h-[320px] md:items-center md:pr-11">
        {imageSlot}
      </div>

      <div className="flex flex-col gap-4 md:h-[320px] md:pl-11">{summarySlot}</div>

      {/* One continuous rule makes the lower divider intersections meet cleanly. */}
      <div className="col-span-full mt-8 h-px bg-soft-tan md:mt-0" />

      {/* LEFT COLUMN — ingredient analysis */}
      <div className="flex flex-col gap-6 pt-8 md:pr-11 md:pt-[25px]">
        <h2 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
          Ingredient analysis
        </h2>

        <div className="flex flex-col gap-4 rounded-lg border border-soft-tan bg-cream p-6">
          {detail ? (
            <>
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-link">
                Ingredient spotlight
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="m-0 font-serif text-[22px] font-medium leading-[28px] text-ink">
                  {detail.name}
                  {detail.pct ? (
                    <span className="text-[15px] font-normal text-faint"> · {detail.pct}</span>
                  ) : null}
                </h3>
                <p className="m-0 font-sans text-[14px] leading-[22px] text-ink">
                  A written breakdown for this ingredient is coming. For now, this panel
                  shows only its name and position on the product label.
                </p>
              </div>

              <div className="h-px bg-soft-tan" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-faint">Position on label</span>
                  <span className="text-[13px] font-bold text-ink">
                    {ordinal(sel + 1)} of {total}
                  </span>
                </div>
              </div>

              <Link
                href={
                  hasResearch
                    ? "#research"
                    : `/ingredients?q=${encodeURIComponent(detail.name)}`
                }
                className="font-sans text-[13px] font-semibold text-link hover:underline"
              >
                {hasResearch ? "Read the research on PubMed →" : "Look up this ingredient →"}
              </Link>
            </>
          ) : (
            <p className="text-[14px] text-muted-foreground">
              No ingredient list on file for this product yet.
            </p>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN — ingredient list; its border begins exactly at the rule */}
      <div className="flex flex-col gap-4 border-soft-tan pt-8 md:border-l md:pl-11 md:pt-[25px]">
        <h3 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
          Ingredients ({total})
        </h3>

        <div className="flex flex-col gap-5 rounded-lg border border-soft-tan bg-cream p-6">
          <p className="m-0 font-serif text-[19px] leading-[30px]">
            {ingredients.map((ing, i) => {
              return (
                <span key={ing.name}>
                  <button
                    type="button"
                    onClick={() => setSel(i)}
                    className="text-link underline decoration-1 underline-offset-[3px] hover:opacity-75"
                  >
                    {ing.name}
                    {ing.pct ? ` ${ing.pct}` : ""}
                  </button>
                  {i < total - 1 ? ", " : "."}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
