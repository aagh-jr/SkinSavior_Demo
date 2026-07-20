/**
 * Deterministic GRADE engine for the Evidence Explainer.
 *
 * Rates the certainty of the body of evidence behind ONE claim from its linked
 * studies. No LLM: given the same studies it always returns the same grade,
 * which is what makes grades consistent across users and auditable for
 * compliance ("our rules engine downgraded this for indirectness" is
 * defensible; "the AI decided" is not).
 *
 * Two frameworks, two jobs (spec section 3):
 *   CEBM design level classifies a single study by design (input, on each study).
 *   GRADE rates the certainty of the whole body of evidence (output, on the claim).
 * Design levels go in; certainty comes out.
 *
 * This module is pure — no I/O, no Supabase. grading-db.ts wires it to the DB.
 */

/** Consumer-facing certainty scale (spec section 6.4). */
export type Certainty = "strong" | "moderate" | "limited" | "very_limited";

export type ReasonDirection = "up" | "down" | "neutral" | "floor";

export interface GradeReason {
  /** Stable machine code, e.g. "indirectness". Drives UI + audit. */
  code: string;
  direction: ReasonDirection;
  /** Plain-language "why", consumer-safe (evidence-framing, not efficacy). */
  text: string;
}

export interface GradeResult {
  certainty: Certainty;
  reasons: GradeReason[];
}

/** CEBM 2011 study design level. */
export type DesignLevel = "1" | "2" | "3" | "4" | "5";

/**
 * Consumer-facing presentation of each certainty grade (spec section 6.4). The
 * only mapping from the internal grade to what a user reads. `notches` drives
 * the meter; `rank` sorts strongest-first. No GRADE vocabulary here — the labels
 * attach to the *evidence*, never the product.
 */
export const CERTAINTY_META: Record<
  Certainty,
  { label: string; notches: 1 | 2 | 3 | 4; rank: number }
> = {
  strong: { label: "Strong evidence", notches: 4, rank: 4 },
  moderate: { label: "Moderate evidence", notches: 3, rank: 3 },
  limited: { label: "Limited evidence", notches: 2, rank: 2 },
  very_limited: { label: "Very limited evidence", notches: 1, rank: 1 },
};

/**
 * CEBM design level to a plain-language study-type tag. Per spec section 9 this
 * is the ONLY place study design vocabulary surfaces — on the Receipts drill-in.
 */
export const DESIGN_TIER_LABELS: Record<DesignLevel, string> = {
  "1": "Systematic review",
  "2": "Randomized trial",
  "3": "Cohort study",
  "4": "Case series",
  "5": "Lab study",
};

/** The subset of a `studies` row that grading actually reads. */
export interface StudyInput {
  /** CEBM 2011 level as a string "1".."5". */
  design_level: DesignLevel;
  sample_size: number | null;
  conflict_flag: boolean;
  effect_direction: "positive" | "null" | "negative" | null;
  /** Concentration as tested, e.g. "10%". Indirectness signal. */
  concentration: string | null;
  vehicle: string | null;
  /** What was measured — a visible skin outcome vs a biomarker in a dish. */
  outcome_measured: string | null;
  effect_size: string | null;
}

// --- Tunable thresholds (auditable; the whole point is that they're explicit) ---

/** GRADE internal level: 4 High, 3 Moderate, 2 Low, 1 Very Low. */
const HIGH = 4;
const LOW = 2;
const VERY_LOW = 1;

/** A trial below this many participants is imprecise. */
const SMALL_SAMPLE = 30;
/** Fraction of studies that must be conflicted to trigger the sponsorship flag. */
const SPONSORSHIP_FRACTION = 0.5;

const LEVEL_TO_CERTAINTY: Record<number, Certainty> = {
  4: "strong",
  3: "moderate",
  2: "limited",
  1: "very_limited",
};

const clamp = (level: number): number => Math.min(HIGH, Math.max(VERY_LOW, level));

/**
 * Case-insensitive check for outcomes that measured a lab biomarker rather than
 * a visible skin change a user cares about. Drives the indirectness downgrade.
 */
function isBiomarkerOutcome(outcome: string | null): boolean {
  if (!outcome) return false;
  const o = outcome.toLowerCase();
  const biomarkers = [
    "biomarker",
    "in vitro",
    "in-vitro",
    "gene expression",
    "mrna",
    "collagen synthesis",
    "fibroblast",
    "assay",
    "cell culture",
  ];
  return biomarkers.some((b) => o.includes(b));
}

/**
 * Grade the body of evidence behind one claim (spec section 6).
 *
 * Pipeline: floor rule, then baseline by best design, then downgraders, then
 * (observational only) upgraders, then clamp and map to the consumer label.
 */
export function gradeClaim(studies: StudyInput[]): GradeResult {
  const reasons: GradeReason[] = [];

  if (studies.length === 0) {
    return {
      certainty: "very_limited",
      reasons: [
        {
          code: "no_studies",
          direction: "floor",
          text: "No studies have been linked to this claim yet.",
        },
      ],
    };
  }

  const levels = studies.map((s) => Number(s.design_level));

  // 1. Floor rule (spec section 6.2). Mechanism-only (all Level 5) evidence caps
  //    at very_limited regardless of anything else — the same line the FTC draws:
  //    in vitro and animal studies can't substantiate a human benefit alone.
  if (levels.every((l) => l === 5)) {
    return {
      certainty: "very_limited",
      reasons: [
        {
          code: "mechanism_only",
          direction: "floor",
          text: "Evidence is limited to lab or mechanism-based studies, not tests on people.",
        },
      ],
    };
  }

  // 2. Baseline by design of the body of evidence.
  const hasRct = levels.some((l) => l === 1 || l === 2);
  let level: number;
  if (hasRct) {
    level = HIGH;
    reasons.push({
      code: "rct_baseline",
      direction: "neutral",
      text: "Backed by one or more randomized human trials.",
    });
  } else {
    level = LOW;
    reasons.push({
      code: "observational_baseline",
      direction: "neutral",
      text: "Backed by observational studies rather than randomized trials.",
    });
  }

  // 3. Downgraders. Each surfaced as its own visible reason.

  // Inconsistency: study results point in different directions.
  const directions = new Set(
    studies.map((s) => s.effect_direction).filter((d): d is NonNullable<typeof d> => d != null),
  );
  if (directions.has("positive") && (directions.has("null") || directions.has("negative"))) {
    level -= 1;
    reasons.push({
      code: "inconsistency",
      direction: "down",
      text: "Results were mixed — not every study found the same effect.",
    });
  }

  // Indirectness (spec section 6.3): tested at concentrations/vehicles unlike
  // typical products, or measured a lab biomarker instead of a visible outcome.
  const indirect = studies.some(
    (s) => isBiomarkerOutcome(s.outcome_measured) || (s.concentration != null && s.vehicle == null),
  );
  const allBiomarker = studies.every((s) => isBiomarkerOutcome(s.outcome_measured));
  if (indirect) {
    level -= allBiomarker ? 2 : 1;
    reasons.push({
      code: "indirectness",
      direction: "down",
      text: "Some studies tested conditions unlike everyday products, or measured lab markers rather than visible skin changes.",
    });
  }

  // Imprecision: trials too small to be confident.
  const smallSampled = studies.filter(
    (s) => s.sample_size != null && s.sample_size < SMALL_SAMPLE,
  );
  if (smallSampled.length > 0 && smallSampled.length === studies.length) {
    level -= 1;
    reasons.push({
      code: "imprecision",
      direction: "down",
      text: "The studies were small, which makes the size of the effect uncertain.",
    });
  }

  // Sponsorship (spec section 6.3): its own flag, not buried in risk-of-bias,
  // because industry funding is pervasive in cosmetics research.
  const conflicted = studies.filter((s) => s.conflict_flag).length;
  if (conflicted / studies.length >= SPONSORSHIP_FRACTION) {
    level -= 1;
    reasons.push({
      code: "sponsorship",
      direction: "down",
      text: "Most of the studies were industry-funded.",
    });
  }

  // 4. Upgraders — observational evidence only (spec section 6.2).
  if (!hasRct) {
    const largeEffect = studies.some(
      (s) => s.effect_size != null && /large|strong|marked/i.test(s.effect_size),
    );
    if (largeEffect) {
      level += 1;
      reasons.push({
        code: "large_effect",
        direction: "up",
        text: "The observed effect was large.",
      });
    }
  }

  const finalLevel = clamp(level);
  return { certainty: LEVEL_TO_CERTAINTY[finalLevel], reasons };
}
