import { CERTAINTY_META, type Certainty } from "./grading";

/**
 * Product-level evidence rollup.
 *
 * Summarizes the graded claims behind a product's researched actives into one
 * glanceable, deterministic line. Like the grade itself this is derived by
 * code only — and it stays a statement about the *evidence* ("Strong evidence
 * behind 2 of 5 claims"), never a product score, so the net impression keeps
 * the evidence label attached to the evidence (docs/claims-policy.md).
 *
 * Pure — callers pass the certainties of already-filtered renderable claims
 * (the read layer has removed prohibited/ungraded ones).
 */
export interface EvidenceRollup {
  /** Renderable graded claims that were rolled up. */
  total: number;
  /** Claims per certainty tier (zero-filled). */
  counts: Record<Certainty, number>;
  /** Strongest tier present. */
  best: Certainty;
  /** Deterministic consumer-safe summary, e.g. "Strong evidence behind 2 of 5 claims". */
  headline: string;
}

const TIERS_STRONGEST_FIRST = (Object.keys(CERTAINTY_META) as Certainty[]).sort(
  (a, b) => CERTAINTY_META[b].rank - CERTAINTY_META[a].rank,
);

export function rollupEvidence(certainties: Certainty[]): EvidenceRollup | null {
  if (certainties.length === 0) return null;

  const counts: Record<Certainty, number> = {
    strong: 0,
    moderate: 0,
    limited: 0,
    very_limited: 0,
  };
  for (const c of certainties) counts[c] += 1;

  const best = TIERS_STRONGEST_FIRST.find((t) => counts[t] > 0) as Certainty;
  const total = certainties.length;
  const bestLabel = CERTAINTY_META[best].label;

  const headline =
    total === 1
      ? `1 graded claim — ${bestLabel.toLowerCase()}`
      : counts[best] === total
        ? `${bestLabel} behind all ${total} claims`
        : `${bestLabel} behind ${counts[best]} of ${total} claims`;

  return { total, counts, best, headline };
}
