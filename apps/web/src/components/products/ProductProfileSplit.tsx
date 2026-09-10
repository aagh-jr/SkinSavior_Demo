"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ProductIngredient } from "@skinsavior/core/types";

/**
 * Product Profile — the shared 4:6 editorial split (Paper "Product Profile —
 * Snail Mucin (proto)"). One vertical hairline runs the full height of the
 * section; the left column stacks [image | analysis], the right column stacks
 * [summary | ingredient list]. Both top blocks are min-h 320px so the two
 * horizontal rules line up across the divider into a clean "+" grid.
 *
 * Interactive: clicking an ingredient in the right-hand list opens its
 * breakdown in the left-hand spotlight card — so the two halves share one
 * `sel` state, which is why the whole split is one client component. The
 * server-rendered image and summary are passed in as slots, keeping their
 * data-fetching on the server.
 *
 * Safety-critical carry-overs from the old decoder (see CLAUDE.md):
 *  - the legend is the vetted 3-tone key, NOT the proto's 5 INCI *function*
 *    categories — `ingredients.functions` is contaminated, and a wrong
 *    "contains fragrance"-style claim is worse than none.
 *  - the spotlight panel states only what the label holds (name, %, tone,
 *    position); it never invents pharmacology prose or an evidence grade.
 */

const ORDINALS = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
];
function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`;
}

function toneChip(tone: string) {
  if (tone === "good") return { bg: "#E7F6EF", fg: "#159A6B" };
  if (tone === "warn") return { bg: "#FDEAEA", fg: "#DC2A2A" };
  return { bg: "#F5F7FA", fg: "#5B6472" };
}

function profileNote(ing: ProductIngredient): { label: string; color: string } {
  if (ing.tags.some((t) => t.tone === "warn"))
    return { label: "Worth noting", color: "#D97706" };
  if (ing.tags.some((t) => t.tone === "good"))
    return { label: "Well matched", color: "#159A6B" };
  return { label: "Neutral", color: "#5B6472" };
}

/** Vetted tone legend — see the file header on why not the proto's functions. */
const LEGEND: { label: string; dot: string }[] = [
  { label: "Well matched", dot: "#159A6B" },
  { label: "Worth noting", dot: "#DC2A2A" },
  { label: "Neutral", dot: "#5B6472" },
];

/** Strip the app's own leading glyph (✓ / ⚠) — the list draws its own marker. */
function stripGlyph(s: string): string {
  return s.replace(/^[✓⚠]\s*/, "");
}

export function ProductProfileSplit({
  imageSlot,
  summarySlot,
  ingredients,
  forYou,
  researchLabels,
}: {
  imageSlot: ReactNode;
  summarySlot: ReactNode;
  ingredients: ProductIngredient[];
  forYou: { good: string[]; warn: string[] };
  researchLabels: Set<string>;
}) {
  const firstWarnIndex = ingredients.findIndex((ing) =>
    ing.tags.some((t) => t.tone === "warn"),
  );
  const [sel, setSel] = useState(Math.max(0, firstWarnIndex));
  const detail = ingredients[sel];
  const total = ingredients.length;
  const hasResearch = detail ? researchLabels.has(detail.name.toLowerCase()) : false;
  const flagged = ingredients.filter((ing) => ing.tags.some((t) => t.tone === "warn"));
  const hasChecklist = forYou.good.length > 0 || forYou.warn.length > 0;

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:gap-[49px]">
      {/* LEFT COLUMN — image over ingredient analysis */}
      <div className="flex flex-col md:w-[511px] md:flex-shrink-0">
        <div className="flex justify-center md:h-[320px] md:items-center">{imageSlot}</div>

        <div className="hidden h-px bg-soft-tan md:block" />

        <div className="flex flex-col gap-6 pt-8 md:pt-[25px]">
          <h2 className="m-0 font-serif text-[22px] font-medium leading-[28px] text-ink">
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
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((t) => {
                      const c = toneChip(t.tone);
                      return (
                        <span
                          key={t.label}
                          className="rounded-md px-2 py-[3px] font-mono text-[12px] font-medium"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          {t.label}
                        </span>
                      );
                    })}
                  </div>
                  <p className="m-0 font-sans text-[14px] leading-[22px] text-ink">
                    A written breakdown for this ingredient is coming. What&apos;s shown here is
                    drawn from this product&apos;s curated label — its role and position, not an
                    AI guess.
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
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-faint">For your profile</span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: profileNote(detail).color }}
                    >
                      {profileNote(detail).label}
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
      </div>

      {/* VERTICAL DIVIDER — the shared 4:6 line */}
      <div className="hidden w-px self-stretch bg-soft-tan md:block" aria-hidden="true" />

      {/* RIGHT COLUMN — summary over ingredient list */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 md:h-[320px]">{summarySlot}</div>

        <div className="hidden h-px bg-soft-tan md:block" />

        <div className="flex flex-col gap-4 pt-8 md:pt-[25px]">
          <h3 className="m-0 font-mono text-[18px] font-bold uppercase tracking-[0.02em] text-ink">
            Ingredients ({total})
          </h3>

          {total > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {LEGEND.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                    style={{ background: l.dot }}
                    aria-hidden="true"
                  />
                  <span className="text-[12px] text-ink">{l.label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-5 rounded-lg border border-soft-tan bg-cream p-6">
            <p className="m-0 font-serif text-[19px] leading-[30px]">
              {ingredients.map((ing, i) => {
                const warn = ing.tags.some((t) => t.tone === "warn");
                return (
                  <span key={ing.name}>
                    <button
                      type="button"
                      onClick={() => setSel(i)}
                      className="underline decoration-1 underline-offset-[3px] hover:opacity-75"
                      style={{ color: warn ? "#DC2A2A" : "#2F6FED" }}
                    >
                      {ing.name}
                      {ing.pct ? ` ${ing.pct}` : ""}
                    </button>
                    {i < total - 1 ? ", " : "."}
                  </span>
                );
              })}
            </p>

            {(flagged.length > 0 || hasChecklist) && (
              <div className="flex flex-col gap-3">
                {forYou.good.map((line) => (
                  <div key={line} className="flex items-start gap-2">
                    <span className="w-3 flex-shrink-0 text-[13px] font-bold text-sage">✓</span>
                    <span className="text-[13px] leading-[17px] text-ink">{stripGlyph(line)}</span>
                  </div>
                ))}
                {forYou.warn.map((line) => (
                  <div key={line} className="flex items-start gap-2">
                    <span className="w-3 flex-shrink-0 text-[13px] font-bold text-clay-strong">!</span>
                    <span className="text-[13px] leading-[17px] text-ink">{stripGlyph(line)}</span>
                  </div>
                ))}
                {!hasChecklist &&
                  flagged.map((ing) => {
                    const warnTag = ing.tags.find((t) => t.tone === "warn");
                    return (
                      <div key={ing.name} className="flex items-start gap-2">
                        <span className="w-3 flex-shrink-0 text-[13px] font-bold text-clay-strong">!</span>
                        <span className="text-[13px] leading-[17px] text-ink">
                          Contains {ing.name} — {warnTag?.label.toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
