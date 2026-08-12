/**
 * Deterministic match scoring: quiz profile x product ingredients.
 *
 * Same inputs always produce the same score and the same reasons. That is the
 * point — the product promises transparency, so a user tapping "why 91?" must
 * get the actual arithmetic, and get the same answer twice. An LLM cannot
 * offer either. Explanation prose can be layered on top later, but it explains
 * this output; it never computes or overrides it.
 *
 * SAFETY IS SEPARATE FROM RANK. `blocked` is its own field, not a large score
 * penalty. Sinking a pregnancy-unsafe retinoid to the bottom of a ranked list
 * hides it from recommendations but leaves a user who reaches that product by
 * search or a shared link with no warning at all. Absence from a list is not a
 * warning, so callers must surface `blockReasons` wherever the product appears.
 *
 * This module is pure — no I/O, no Supabase. match-db.ts wires it to the DB.
 */

import { groupsForIngredient, positionWeight, type ActiveGroup } from "./actives";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface SkinProfile {
  skinType?: string | null; // dry | normal | combination | oily
  sensitivity?: string | null; // low | medium | high
  pigmentation?: string | null; // none | occasional_marks | persistent_spots
  agingConcern?: string | null; // smooth | fine_lines | visible_wrinkles
  pregnancyStatus?: string | null; // pregnant_or_breastfeeding | not_applicable | prefer_not_to_say
  medications?: string[] | null; // retinoid_rx | isotretinoin | other_topical_rx | none
  reactions?: string[] | null; // fragrance | alcohol | actives | essential_oils | none
  currentRoutine?: string[] | null; // cleanser | toner | serum | ...
}

export interface ScoredIngredient {
  inciName: string;
  /** 1-based INCI position; concentration order. */
  position: number;
  /** INCIDecoder function tags, where known. */
  functions?: string[] | null;
}

export interface ScorableProduct {
  id: string;
  canonicalCategory?: string | null;
  ingredients: ScoredIngredient[];
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type ReasonDirection = "up" | "down" | "block";

export interface ScoreReason {
  /** Stable machine code — drives UI grouping and audit. */
  code: string;
  direction: ReasonDirection;
  /** Points contributed. Always 0 for blocks: they don't move the score. */
  points: number;
  /** Consumer-facing "why". States the mechanism, never fearmongers. */
  text: string;
  /** The ingredients that triggered this, for "show your work" UI. */
  ingredients: string[];
}

export interface MatchResult {
  /** 0-100. Computed even when blocked, so a warned product can still rank. */
  score: number;
  /** True when a safety rule fired. Exclude from recommendations. */
  blocked: boolean;
  blockReasons: ScoreReason[];
  reasons: ScoreReason[];
}

const BASE_SCORE = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Hit {
  name: string;
  position: number;
  weight: number;
}

/** Index a product's ingredients by active group, keeping position weight. */
function indexByGroup(product: ScorableProduct): Map<ActiveGroup, Hit[]> {
  const index = new Map<ActiveGroup, Hit[]>();
  for (const ing of product.ingredients) {
    for (const group of groupsForIngredient(ing.inciName)) {
      const hits = index.get(group) ?? [];
      hits.push({
        name: ing.inciName,
        position: ing.position,
        weight: positionWeight(ing.position),
      });
      index.set(group, hits);
    }
  }
  return index;
}

/** Strongest position weight in a set of hits (0 when empty). */
function peak(hits: Hit[] | undefined): number {
  if (!hits?.length) return 0;
  return Math.max(...hits.map((h) => h.weight));
}

/**
 * Ingredient names for display, strongest first, de-duplicated.
 *
 * An ingredient can legitimately match several groups (squalane is both a
 * barrier lipid and an emollient; panthenol is both humectant and soothing),
 * so combined hit lists repeat names. Showing "squalane, squalane" as the
 * evidence for a score looks broken.
 */
function names(hits: Hit[] | undefined, limit = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const hit of [...(hits ?? [])].sort((a, b) => a.position - b.position)) {
    const key = hit.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit.name);
    if (out.length >= limit) break;
  }
  return out;
}

const has = (list: string[] | null | undefined, value: string) =>
  (list ?? []).includes(value);

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export function scoreProduct(
  profile: SkinProfile,
  product: ScorableProduct,
): MatchResult {
  const g = indexByGroup(product);
  const reasons: ScoreReason[] = [];
  const blockReasons: ScoreReason[] = [];

  const block = (code: string, text: string, hits: Hit[]) =>
    blockReasons.push({ code, direction: "block", points: 0, text, ingredients: names(hits) });

  const add = (code: string, points: number, text: string, hits: Hit[]) => {
    if (points === 0) return;
    reasons.push({
      code,
      direction: points > 0 ? "up" : "down",
      points: Math.round(points),
      text,
      ingredients: names(hits),
    });
  };

  // -- Hard safety rules ----------------------------------------------------
  // Position weight is deliberately ignored here: a trace amount still counts.

  const retinoids = g.get("retinoid");
  if (retinoids?.length && profile.pregnancyStatus === "pregnant_or_breastfeeding") {
    block(
      "pregnancy_retinoid",
      "Contains a retinoid. Standard guidance is to avoid topical retinoids while pregnant or breastfeeding — worth confirming with your doctor.",
      retinoids,
    );
  }

  if (has(profile.medications, "isotretinoin")) {
    const harsh = [
      ...(retinoids ?? []),
      ...(g.get("aha") ?? []),
      ...(g.get("bha") ?? []),
      ...(g.get("physical_scrub") ?? []),
    ];
    if (harsh.length) {
      block(
        "isotretinoin_conflict",
        "You noted recent isotretinoin, which already leaves skin dry and fragile. Layering another retinoid or exfoliant on top is usually too much.",
        harsh,
      );
    }
  }

  // Self-reported reactions are the user's own boundary — treat as hard.
  if (has(profile.reactions, "fragrance")) {
    const hits = g.get("fragrance");
    if (hits?.length) {
      block("reaction_fragrance", "Contains fragrance, which you flagged as something you react to.", hits);
    }
  }
  if (has(profile.reactions, "essential_oils")) {
    const hits = g.get("essential_oil");
    if (hits?.length) {
      block("reaction_essential_oil", "Contains essential oils, which you flagged as something you react to.", hits);
    }
  }
  if (has(profile.reactions, "alcohol")) {
    const hits = g.get("drying_alcohol");
    if (hits?.length) {
      block("reaction_alcohol", "Contains a drying alcohol, which you flagged as something you react to.", hits);
    }
  }
  if (has(profile.reactions, "actives")) {
    const hits = [...(retinoids ?? []), ...(g.get("aha") ?? []), ...(g.get("bha") ?? [])];
    if (hits.length) {
      block("reaction_actives", "Contains a retinoid or exfoliating acid, which you flagged as something you react to.", hits);
    }
  }

  // -- Concern matching -----------------------------------------------------

  if (profile.pigmentation === "persistent_spots" || profile.pigmentation === "occasional_marks") {
    const hits = [...(g.get("brightening") ?? []), ...(g.get("vitamin_c") ?? [])];
    const strength = peak(hits);
    const weight = profile.pigmentation === "persistent_spots" ? 18 : 11;
    add(
      "brightening_match",
      strength * weight,
      "Contains brightening actives that target uneven tone and dark spots.",
      hits,
    );
  }

  if (profile.agingConcern === "fine_lines" || profile.agingConcern === "visible_wrinkles") {
    const hits = [
      ...(retinoids ?? []),
      ...(g.get("peptide") ?? []),
      ...(g.get("antioxidant") ?? []),
    ];
    const weight = profile.agingConcern === "visible_wrinkles" ? 18 : 11;
    add(
      "aging_match",
      peak(hits) * weight,
      "Contains actives studied for fine lines and firmness.",
      hits,
    );
  }

  // -- Skin type ------------------------------------------------------------

  if (profile.skinType === "dry") {
    const hits = [
      ...(g.get("barrier") ?? []),
      ...(g.get("humectant") ?? []),
      ...(g.get("emollient") ?? []),
    ];
    add("dry_skin_match", peak(hits) * 14, "Rich in barrier lipids and humectants for dry skin.", hits);
  }

  if (profile.skinType === "oily" || profile.skinType === "combination") {
    const hits = [...(g.get("mattifier") ?? []), ...(g.get("bha") ?? [])];
    add(
      "oily_skin_match",
      peak(hits) * 12,
      "Includes oil-absorbing or pore-clearing ingredients suited to oilier skin.",
      hits,
    );
  }

  // -- Sensitivity ----------------------------------------------------------

  if (profile.sensitivity === "high" || profile.sensitivity === "medium") {
    const soothing = g.get("soothing") ?? [];
    const weight = profile.sensitivity === "high" ? 15 : 9;
    add("soothing_match", peak(soothing) * weight, "Contains soothing ingredients that suit reactive skin.", soothing);

    // Irritants only penalise here — a user who flagged the reaction outright
    // has already had it blocked above, so this never double-counts.
    if (!has(profile.reactions, "fragrance")) {
      // Curated name matches ONLY — deliberately not the INCIDecoder
      // "perfuming" function tag. That tag is noisy in our catalog (it lands
      // on things like caffeine and hexylene glycol), and a false "contains
      // fragrance" warning is worse than a missed one: it is a factual claim
      // about the product that a user can check and find wrong.
      const fragrance = g.get("fragrance") ?? [];
      const penalty = profile.sensitivity === "high" ? 14 : 7;
      add(
        "fragrance_penalty",
        -peak(fragrance) * penalty,
        "Contains fragrance, a common trigger for reactive skin.",
        fragrance,
      );
    }
    if (!has(profile.reactions, "alcohol")) {
      const alcohol = g.get("drying_alcohol");
      add(
        "alcohol_penalty",
        -peak(alcohol) * (profile.sensitivity === "high" ? 10 : 5),
        "Contains a drying alcohol, which can sting reactive skin.",
        alcohol ?? [],
      );
    }
    const scrub = g.get("physical_scrub") ?? [];
    add(
      "scrub_penalty",
      -peak(scrub) * (profile.sensitivity === "high" ? 12 : 6),
      "Contains a physical scrub, which is abrasive on sensitive skin.",
      scrub,
    );
  }

  // -- Already owned --------------------------------------------------------
  // Not a quality judgement: a nudge so recommendations aren't all duplicates
  // of a shelf the user already has.

  const owned = ownedCategory(profile.currentRoutine, product.canonicalCategory);
  if (owned) {
    add("already_owned", -6, "You already use a product in this category.", []);
  }

  const total = reasons.reduce((sum, r) => sum + r.points, BASE_SCORE);

  return {
    score: Math.max(0, Math.min(100, Math.round(total))),
    blocked: blockReasons.length > 0,
    blockReasons,
    reasons: reasons.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
  };
}

/** Quiz `current_routine` values -> canonical categories they cover. */
const OWNED_MAP: Record<string, string[]> = {
  cleanser: ["cleanser", "oil_cleanser"],
  toner: ["toner"],
  serum: ["serum", "essence"],
  moisturizer: ["moisturizer"],
  spf: ["sunscreen"],
  retinoid: [],
  exfoliant: ["exfoliant"],
};

function ownedCategory(
  currentRoutine: string[] | null | undefined,
  category: string | null | undefined,
): boolean {
  if (!currentRoutine?.length || !category) return false;
  return currentRoutine.some((answer) => (OWNED_MAP[answer] ?? []).includes(category));
}

/**
 * Rank a set of products for one profile.
 *
 * Blocked products are returned but sorted last and flagged, never silently
 * dropped — callers decide whether to render them with a warning or hide them.
 * `total` and `blockedCount` let the UI say "all 7 exfoliants we know about"
 * rather than implying a selection that never happened.
 */
export interface RankedProduct<T> {
  product: T;
  result: MatchResult;
}

export function rankProducts<T extends ScorableProduct>(
  profile: SkinProfile,
  products: T[],
  options: { limit?: number; includeBlocked?: boolean } = {},
): { ranked: RankedProduct<T>[]; total: number; blockedCount: number } {
  const scored = products.map((product) => ({ product, result: scoreProduct(profile, product) }));
  const blockedCount = scored.filter((s) => s.result.blocked).length;

  const visible = options.includeBlocked ? scored : scored.filter((s) => !s.result.blocked);

  visible.sort((a, b) => {
    // Blocked always sinks, regardless of score.
    if (a.result.blocked !== b.result.blocked) return a.result.blocked ? 1 : -1;
    return b.result.score - a.result.score;
  });

  return {
    ranked: options.limit ? visible.slice(0, options.limit) : visible,
    total: products.length,
    blockedCount,
  };
}
