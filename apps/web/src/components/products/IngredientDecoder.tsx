"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchResult } from "@skinsavior/core/scoring";
import type { ProductIngredient } from "@skinsavior/core/types";

/**
 * The redesigned "What's inside" — click an ingredient on the right and its
 * breakdown opens on the left, alongside the "Your match" card and the
 * "Ingredient key" legend.
 *
 * IMPORTANT: this is the new version of BOTH the match summary and the
 * ingredient list, so it must not lose what the old MatchScore panel did:
 *  - safety blocks render first and unconditionally (blockReasons), because a
 *    "not recommended while pregnant" warning has to be seen by anyone who
 *    reaches this page, not just those who scrolled a ranked list.
 *  - every reason keeps its points — the product never shows a bare number.
 *
 * The detail panel shows only what the data actually holds (name, %, the roles
 * on the curated label, label position). It does NOT invent pharmacology prose
 * or per-ingredient evidence grades — those aren't in the product model, and a
 * plausible-sounding fabrication is exactly what this product exists to avoid.
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

/** A profile read that only restates the curated tag tones — never invented. */
function profileNote(ing: ProductIngredient): { label: string; color: string } {
  if (ing.tags.some((t) => t.tone === "warn"))
    return { label: "Worth noting", color: "#DC2A2A" };
  if (ing.tags.some((t) => t.tone === "good"))
    return { label: "Well matched", color: "#159A6B" };
  return { label: "Neutral", color: "#5B6472" };
}

/** Legend categories the ingredient list can actually back with data: the
 *  curated tone (good/warn/neutral) on each tag. The Paper design's "Ingredient
 *  key" shows five INCI *function* categories (Humectant, Soothing, Texture /
 *  emulsifier, Preservative, Active) — we deliberately don't reproduce those:
 *  per CLAUDE.md, `ingredients.functions` is contaminated (the enrichment
 *  scraper grabbed every function link off each INCIDecoder page, so caffeine
 *  came back "perfuming"), and a wrong "contains fragrance"-style claim is
 *  worse than none. Tone is the one signal already vetted and used everywhere
 *  else in the app (SaveButton, MatchScore, safety facts). */
const LEGEND: { label: string; dot: string }[] = [
  { label: "Well matched", dot: "#159A6B" },
  { label: "Worth noting", dot: "#DC2A2A" },
  { label: "Neutral", dot: "#5B6472" },
];

/** Strip the app's own leading glyph (✓ / ⚠) from forYou copy — the list
 *  supplies its own bullet marker matching the design, so a doubled glyph
 *  would read oddly. */
function stripGlyph(s: string): string {
  return s.replace(/^[✓⚠]\s*/, "");
}

export function IngredientDecoder({
  ingredients,
  forYou,
  researchLabels,
}: {
  ingredients: ProductIngredient[];
  /** "What's inside" checklist copy — empty for most DB products today (see
   *  products-db.ts), in which case that part of the list is simply omitted. */
  forYou: { good: string[]; warn: string[] };
  /** Ingredient names (lowercased) that have PubMed research further down the
   *  page, so the detail panel can link to it honestly instead of always. */
  researchLabels: Set<string>;
}) {
  // Open on the first flagged ingredient by default — the thing worth seeing
  // first — falling back to the top of the label when nothing is flagged.
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
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
      {/* LEFT — ingredient detail */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-link">
            Ingredient
          </span>
          <span className="text-[11px] text-faint">
            {sel + 1} of {total}
          </span>
        </div>
        <div className="min-h-[340px] rounded-sm border border-soft-tan bg-cream p-6">
        {detail ? (
          <>
            <h3 className="font-mono text-[28px] font-medium leading-[1.15] text-ink">
              {detail.name}
            </h3>
            {detail.pct && (
              <div className="mt-1 text-[13px] text-faint">{detail.pct}</div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {detail.tags.map((t) => {
                const c = toneChip(t.tone);
                return (
                  <span
                    key={t.label}
                    className="rounded-md px-2 py-1 text-[12px] font-medium"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    {t.label}
                  </span>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-2.5 border-t border-soft-tan pt-4">
              <div className="flex justify-between gap-3">
                <span className="text-[13px] text-faint">Position on label</span>
                <span className="text-[13px] font-semibold text-ink">
                  {ordinal(sel + 1)} of {total}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[13px] text-faint">For your profile</span>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: profileNote(detail).color }}
                >
                  {profileNote(detail).label}
                </span>
              </div>
            </div>

            <p className="mt-5 text-[15px] leading-[1.45] text-ink">
              A written breakdown for this ingredient is coming. What&apos;s shown
              above is drawn from this product&apos;s curated label — its role and
              position, not an AI guess.
            </p>
            <Link
              href={hasResearch ? "#research" : `/ingredients?q=${encodeURIComponent(detail.name)}`}
              className="mt-4 inline-block text-[13px] font-semibold text-link hover:underline"
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

      {/* RIGHT — ingredient key + ingredient list (match card now lives in its
          own section above, rendered by the page) */}
      <div className="flex flex-col gap-5">
        {total > 0 && (
          <div className="flex flex-col items-end gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-link">
              Ingredient key
            </span>
            <div className="flex w-full flex-wrap items-center justify-center gap-5 rounded-sm bg-cream px-5 py-4">
              {LEGEND.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ background: l.dot }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-ink">{l.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-link">
            Ingredients ({total})
          </span>
          <div className="mt-3 rounded-sm border border-soft-tan bg-cream p-5">
            <p className="m-0 text-[15px] leading-[1.5]">
              {ingredients.map((ing, i) => {
                const warn = ing.tags.some((t) => t.tone === "warn");
                return (
                  <span key={ing.name}>
                    <button
                      type="button"
                      onClick={() => setSel(i)}
                      className="underline decoration-1 underline-offset-2 hover:opacity-75"
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

            {flagged.length > 0 && (
              <div className="mt-3.5 flex flex-col gap-1.5">
                {flagged.map((ing) => {
                  const warnTag = ing.tags.find((t) => t.tone === "warn");
                  return (
                    <p key={ing.name} className="m-0 text-[13px] font-semibold text-danger">
                      {ing.name} — {warnTag?.label}
                    </p>
                  );
                })}
              </div>
            )}

            {hasChecklist && (
              <div className="mt-4 flex flex-col gap-2.5">
                {forYou.good.map((line) => (
                  <div key={line} className="flex items-start gap-2.5">
                    <span className="text-sm text-sage">✓</span>
                    <span className="text-sm leading-relaxed text-ink">{stripGlyph(line)}</span>
                  </div>
                ))}
                {forYou.warn.map((line) => (
                  <div key={line} className="flex items-start gap-2.5">
                    <span className="text-sm font-semibold text-danger">!</span>
                    <span className="text-sm leading-relaxed text-ink">{stripGlyph(line)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function KeyCard({
  match,
  evidenceGrade,
  rating,
  reviewCount,
  ingredientCount,
}: {
  match: MatchResult | null;
  evidenceGrade: string;
  rating: number;
  reviewCount: number;
  ingredientCount: number;
}) {
  // No profile — prompt rather than invent a number. Same contract as the old
  // MatchScore panel.
  if (!match) {
    return (
      <div className="rounded-2xl border border-dashed border-soft-tan bg-white p-6">
        <h2 className="m-0 font-mono text-[22px] font-medium text-ink">Your match</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Take the skin quiz and we&apos;ll score this product against your skin
          type, concerns, and anything you&apos;ve reacted to — showing exactly
          how we got the number.
        </p>
        <Link
          href="/quiz"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Take the quiz →
        </Link>
        <StatRow
          evidenceGrade={evidenceGrade}
          rating={rating}
          reviewCount={reviewCount}
          ingredientCount={ingredientCount}
        />
      </div>
    );
  }

  const { score, blocked, blockReasons, reasons } = match;

  return (
    <div className="rounded-2xl border border-soft-tan bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-mono text-[22px] font-medium text-ink">Your match</h2>
        <div
          className="flex h-[66px] w-[66px] flex-col items-center justify-center rounded-2xl"
          style={
            blocked
              ? { background: "#12181F", color: "#FFFFFF" }
              : { background: "#2F6FED", color: "#FFFFFF" }
          }
        >
          <span className="font-serif text-[23px] font-semibold leading-none">
            {blocked ? "!" : `${score}%`}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-[0.12em] opacity-85">
            {blocked ? "check" : "match"}
          </span>
        </div>
      </div>

      {/* Safety block — first and unconditional. */}
      {blocked && (
        <div
          className="mt-4 rounded-xl border border-danger/30 bg-danger-bg p-4"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-danger text-[13px] leading-none text-white"
            >
              ✕
            </span>
            <span className="font-serif text-[17px] font-medium text-danger">
              Not recommended for you
            </span>
          </div>
          <ul className="mt-3 list-none space-y-3 p-0">
            {blockReasons.map((r) => (
              <li key={r.code} className="border-l-2 border-danger/30 pl-3">
                <p className="m-0 text-[14px] leading-relaxed text-ink">{r.text}</p>
                {r.ingredients.length > 0 && (
                  <p className="mt-1 text-[12px] text-faint">
                    Because of: {r.ingredients.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasons — every one keeps its points (show your work). */}
      {reasons.length > 0 && (
        <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
          {blocked && (
            <li className="text-[13px] text-muted-foreground">
              What it would have matched, if not for the above:
            </li>
          )}
          {reasons.map((r) => (
            <li key={r.code} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 inline-flex h-[22px] min-w-[36px] flex-shrink-0 items-center justify-center rounded-full px-2 font-mono text-[12px] font-semibold"
                style={
                  blocked
                    ? { background: "#F5F7FA", color: "#5B6472" }
                    : r.direction === "up"
                      ? { background: "#E7F6EF", color: "#159A6B" }
                      : { background: "#FDEAEA", color: "#DC2A2A" }
                }
              >
                {r.points > 0 ? `+${r.points}` : r.points}
              </span>
              <span className="min-w-0 text-[14px] leading-[1.5] text-ink">
                {r.text}
                {r.ingredients.length > 0 && (
                  <span className="text-faint"> — {r.ingredients.join(", ")}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {reasons.length === 0 && !blocked && (
        <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
          Nothing in this formula speaks to the concerns you told us about,
          either way.
        </p>
      )}

      <StatRow
        evidenceGrade={evidenceGrade}
        rating={rating}
        reviewCount={reviewCount}
        ingredientCount={ingredientCount}
      />

      <p className="mt-4 border-t border-soft-tan pt-3 text-[12px] leading-relaxed text-faint">
        {blocked
          ? "Based on your quiz answers and this product's ingredient list, checked against documented ingredient guidance. Information to weigh, not medical advice."
          : "Scored from your quiz answers and this product's ingredient list. The same answers always produce the same score — no AI guesswork."}
      </p>
    </div>
  );
}

function StatRow({
  evidenceGrade,
  rating,
  reviewCount,
  ingredientCount,
}: {
  evidenceGrade: string;
  rating: number;
  reviewCount: number;
  ingredientCount: number;
}) {
  return (
    <div className="mt-4 flex gap-6 border-t border-soft-tan pt-4">
      <div>
        <div className="font-serif text-[20px] font-semibold text-ink">{evidenceGrade}</div>
        <div className="text-[11px] text-faint">evidence</div>
      </div>
      {reviewCount > 0 && (
        <div>
          <div className="font-serif text-[20px] font-semibold text-ink">{rating}</div>
          <div className="text-[11px] text-faint">
            {reviewCount.toLocaleString()} reviews
          </div>
        </div>
      )}
      <div>
        <div className="font-serif text-[20px] font-semibold text-ink">{ingredientCount}</div>
        <div className="text-[11px] text-faint">ingredients</div>
      </div>
    </div>
  );
}
