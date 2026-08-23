// Scoring a product against the routine you already own, not just your skin.
//
// WHY THIS EXISTS
// scoreProduct() answers "does this suit your skin?" one product at a time. It
// never looks at anything else you use. analyzeRoutine() answers "do these
// work together?" but only runs on a routine you have already saved. Nothing
// connected them, so /for-you could confidently rank a BHA toner #1 for
// someone whose routine already contains a retinoid, and the clash only
// surfaced later, after they had bought it and added it.
//
// This module joins the two. It builds a hypothetical routine of
// (what you own + this candidate), runs the existing, tested interaction
// engine over it, and keeps only the findings the candidate is actually
// involved in.
//
// TWO DECISIONS WORTH KEEPING
//
// 1. A conflict does NOT change the score. It is a separate field, exactly as
//    `blocked` is, and for the same reason the codebase already documents:
//    burying a product in the ranking hides it without explaining anything.
//    Most routine conflicts are resolved by timing rather than by avoidance --
//    "use one in the morning and one at night" -- so silently sinking a good
//    product would be both unhelpful and wrong. Surface it, explain it, let
//    the person decide.
//
// 2. Only findings that involve the candidate are attributed to it. If two
//    products already in your routine clash with each other, that is real, but
//    it is not this product's fault and must not appear on its card. The
//    routine page is where that belongs.

import {
  analyzeRoutine,
  type CompatibilityFinding,
  type RoutineStepInput,
  type Severity,
  type TimeOfDay,
} from "./interactions";
import {
  scoreProduct,
  type MatchResult,
  type ScorableProduct,
  type SkinProfile,
} from "./match";

/** How a candidate product sits alongside a routine the user already has. */
export interface RoutineFit {
  /** Findings involving this product and something already in the routine. */
  conflicts: CompatibilityFinding[];
  /** Worst severity among them, or null when there are none. */
  worstSeverity: Severity | null;
  /** True when the routine was empty, so "no conflicts" means "not checked". */
  unchecked: boolean;
}

export interface RoutineAwareResult extends MatchResult {
  fit: RoutineFit;
}

// A label the user's own products cannot collide with. Findings are matched by
// label, so a candidate sharing a name with a routine step would otherwise be
// indistinguishable from it.
const CANDIDATE_LABEL = "\u0000candidate\u0000";

export interface RoutineFitOptions {
  /**
   * When the candidate would be used. Defaults to "both", which is the
   * CONSERVATIVE choice: rules marked sameTimeOnly then always apply, so a
   * possible clash is shown rather than hidden by an assumption about
   * scheduling we have not actually asked the user to make.
   */
  timeOfDay?: TimeOfDay;
  /** Canonical category of the candidate, used by the sunscreen rules. */
  category?: string | null;
}

/**
 * Findings that arise from adding one product to an existing routine.
 *
 * Steps already in the routine that ARE the candidate (same id) are dropped
 * first, so re-viewing something you already own doesn't report it clashing
 * with itself.
 */
export function findRoutineConflicts(
  candidate: { id: string; ingredients: string[] },
  routine: RoutineStepInput[],
  options: RoutineFitOptions = {},
): RoutineFit {
  const others = routine.filter((s) => s.id !== candidate.id);
  if (!others.length) {
    return { conflicts: [], worstSeverity: null, unchecked: true };
  }

  const hypothetical: RoutineStepInput[] = [
    ...others,
    {
      id: candidate.id,
      label: CANDIDATE_LABEL,
      timeOfDay: options.timeOfDay ?? "both",
      ingredients: candidate.ingredients,
      category: options.category ?? null,
    },
  ];

  const conflicts = analyzeRoutine(hypothetical).findings.filter((f) =>
    f.steps.includes(CANDIDATE_LABEL),
  );

  // Findings name the candidate by its sentinel; swap it back for something
  // renderable. "This product" reads correctly on a page that is already
  // showing the product.
  const cleaned = conflicts.map((f) => ({
    ...f,
    title: f.title.split(CANDIDATE_LABEL).join("This product"),
    steps: f.steps.map((s) => (s === CANDIDATE_LABEL ? "This product" : s)),
  }));

  const worstSeverity: Severity | null = cleaned.some((f) => f.severity === "major")
    ? "major"
    : cleaned.length
      ? "minor"
      : null;

  return { conflicts: cleaned, worstSeverity, unchecked: false };
}

/** scoreProduct(), plus how the product sits with a routine already owned. */
export function scoreProductForRoutine(
  profile: SkinProfile,
  product: ScorableProduct,
  routine: RoutineStepInput[],
  options: RoutineFitOptions = {},
): RoutineAwareResult {
  const result = scoreProduct(profile, product);
  const fit = findRoutineConflicts(
    { id: product.id, ingredients: product.ingredients.map((i) => i.inciName) },
    routine,
    { category: product.canonicalCategory, ...options },
  );
  return { ...result, fit };
}

export interface RoutineRankedProduct<T> {
  product: T;
  result: RoutineAwareResult;
}

/**
 * Rank a category with routine awareness.
 *
 * Ordering is unchanged from rankProducts(): conflicts do not move a product.
 * `conflictCount` lets the UI be honest about the shape of the list -- "3 of
 * these interact with what you already use" -- instead of leaving someone to
 * discover it one product at a time.
 */
export function rankProductsForRoutine<T extends ScorableProduct>(
  profile: SkinProfile,
  products: T[],
  routine: RoutineStepInput[],
  options: { limit?: number; includeBlocked?: boolean } = {},
): {
  ranked: RoutineRankedProduct<T>[];
  total: number;
  blockedCount: number;
  conflictCount: number;
} {
  const scored = products.map((product) => ({
    product,
    result: scoreProductForRoutine(profile, product, routine),
  }));

  const blockedCount = scored.filter((s) => s.result.blocked).length;
  const visible = options.includeBlocked ? scored : scored.filter((s) => !s.result.blocked);

  visible.sort((a, b) => {
    if (a.result.blocked !== b.result.blocked) return a.result.blocked ? 1 : -1;
    return b.result.score - a.result.score;
  });

  return {
    ranked: options.limit ? visible.slice(0, options.limit) : visible,
    total: products.length,
    blockedCount,
    conflictCount: visible.filter((s) => s.result.fit.conflicts.length > 0).length,
  };
}
