/**
 * Routine compatibility: ingredient clashes and single-ingredient usage rules.
 *
 * WHY THE KNOWLEDGE BASE IS CODE, NOT A TABLE
 * docs/ai-pipeline.md proposed an `ingredient_interactions` table with pgvector
 * so "glycolic acid" could fuzzy-match the "AHA class". That problem is already
 * solved deterministically: actives.ts classifies every ingredient into a
 * group, so interactions are declared BETWEEN GROUPS and no embedding lookup is
 * needed. Keeping them here makes them versioned, diffable in review, and
 * unit-testable, and it keeps the analysis a pure function. If these ever need
 * editing without a deploy, moving them to a table is a small migration — the
 * shape below is already row-like.
 *
 * The model never invents an interaction. It may later phrase these findings
 * more naturally, but every claim originates in this file.
 *
 * TWO KINDS OF RULE, because they answer different questions:
 *   INTERACTIONS  — A + B together in the same part of the routine.
 *   USAGE_RULES   — one ingredient, wrong time of day or missing a companion.
 * "Retinol shouldn't be used in the morning" is the second kind, and a
 * pairwise-only model cannot express it.
 */

import { groupsForIngredient, type ActiveGroup } from "./actives";

export type Severity = "minor" | "major";

/**
 * A = consistent human trials; B = limited human evidence; C = mechanistic or
 * in-vitro only; D = widely repeated but poorly evidenced. Shown to users so
 * folklore is visibly distinguishable from documented pharmacology.
 */
export type EvidenceTier = "A" | "B" | "C" | "D";

export type TimeOfDay = "am" | "pm" | "both";

// ---------------------------------------------------------------------------
// Pairwise interactions
// ---------------------------------------------------------------------------

export interface InteractionRule {
  code: string;
  a: ActiveGroup;
  b: ActiveGroup;
  severity: Severity;
  /** What actually happens, mechanistically. No scare language. */
  mechanism: string;
  /** Concrete fix, not "consult a professional". */
  recommendation: string;
  evidenceTier: EvidenceTier;
  /**
   * When true the pair only matters used at the same time of day; alternating
   * AM/PM resolves it. When false it applies however they're scheduled.
   */
  sameTimeOnly: boolean;
}

export const INTERACTIONS: InteractionRule[] = [
  {
    code: "retinoid_plus_aha",
    a: "retinoid",
    b: "aha",
    severity: "major",
    mechanism:
      "Retinoids increase cell turnover and AHAs loosen the bonds between surface cells. Together they commonly over-exfoliate, which shows up as redness, flaking and stinging.",
    recommendation:
      "Use them on alternate nights rather than layering. If your skin is already tolerant of both, keep at least one buffer night between them.",
    evidenceTier: "B",
    sameTimeOnly: true,
  },
  {
    code: "retinoid_plus_bha",
    a: "retinoid",
    b: "bha",
    severity: "major",
    mechanism:
      "Both increase turnover of the skin's surface layer. Used in the same routine they frequently tip into irritation and a compromised barrier.",
    recommendation: "Alternate nights, or move the BHA to your morning routine.",
    evidenceTier: "B",
    sameTimeOnly: true,
  },
  {
    code: "retinoid_plus_benzoyl_peroxide",
    a: "retinoid",
    b: "benzoyl_peroxide",
    severity: "major",
    mechanism:
      "Benzoyl peroxide oxidises tretinoin and retinol applied at the same time, leaving less active retinoid on the skin. Adapalene is the documented exception — it is stable alongside benzoyl peroxide, which is why the two are sold as a combined prescription.",
    recommendation:
      "Split them: benzoyl peroxide in the morning, retinoid at night. If your retinoid is adapalene specifically, using them together is fine.",
    evidenceTier: "B",
    sameTimeOnly: true,
  },
  {
    code: "scrub_plus_chemical_exfoliant",
    a: "physical_scrub",
    b: "aha",
    severity: "major",
    mechanism:
      "Mechanical scrubbing on top of chemical exfoliation removes more of the surface layer than either does alone, and the damage is easy to miss until the barrier is already impaired.",
    recommendation:
      "Pick one method. Chemical exfoliation is easier to control, so most people drop the scrub.",
    evidenceTier: "C",
    sameTimeOnly: false,
  },
  {
    code: "scrub_plus_retinoid",
    a: "physical_scrub",
    b: "retinoid",
    severity: "major",
    mechanism:
      "Retinoid-treated skin sheds faster and is more fragile; scrubbing it mechanically tends to cause visible irritation.",
    recommendation: "Drop the scrub while you're using a retinoid.",
    evidenceTier: "C",
    sameTimeOnly: false,
  },
  {
    code: "vitamin_c_plus_aha",
    a: "vitamin_c",
    b: "aha",
    severity: "minor",
    mechanism:
      "Pure L-ascorbic acid needs a low pH to stay stable and absorb, and layering an acid immediately over it can affect both. In practice this is a formulation-stability point more than a skin-safety one — the main real-world effect is irritation in people who are already sensitive.",
    recommendation:
      "Leave a few minutes between them, or use vitamin C in the morning and the acid at night. No need to avoid the combination outright.",
    evidenceTier: "C",
    sameTimeOnly: true,
  },
];

/**
 * NOT A CLASH — deliberately recorded so the app can say so.
 *
 * "Niacinamide and vitamin C cancel each other out" is the most repeated
 * skincare interaction online and it is not supported: it comes from 1960s
 * research on unstable raw ingredients at high heat, not modern formulations.
 * The product's promise is transparent information rather than fearmongering,
 * so wrongly-feared pairs deserve the same visibility as real ones.
 */
export const DEBUNKED_PAIRS: {
  code: string;
  a: ActiveGroup;
  b: ActiveGroup;
  note: string;
}[] = [
  {
    code: "niacinamide_plus_vitamin_c_myth",
    a: "brightening",
    b: "vitamin_c",
    note: "Niacinamide and vitamin C are fine together. The idea that they cancel out traces to mid-century experiments on raw ingredients under heat, not finished products — modern formulations are stable, and the pair is common in well-regarded serums.",
  },
];

// ---------------------------------------------------------------------------
// Single-ingredient usage rules
// ---------------------------------------------------------------------------

export interface UsageRule {
  group: ActiveGroup;
  /** Increases UV sensitivity, so needs daytime sun protection. */
  photosensitising: boolean;
  /** Where this belongs in a routine; "both" = no constraint. */
  preferredTime: TimeOfDay;
  reason: string;
  evidenceTier: EvidenceTier;
}

export const USAGE_RULES: UsageRule[] = [
  {
    group: "retinoid",
    photosensitising: true,
    preferredTime: "pm",
    reason:
      "Retinoids break down in UV light and leave skin more sun-sensitive while you're using them. Night application avoids both problems.",
    evidenceTier: "B",
  },
  {
    group: "aha",
    photosensitising: true,
    preferredTime: "pm",
    reason:
      "AHAs measurably increase UV sensitivity — enough that sunscreen warnings on AHA products are a regulatory requirement in the US, and the effect persists for about a week after use.",
    evidenceTier: "A",
  },
  {
    group: "bha",
    photosensitising: true,
    preferredTime: "both",
    reason:
      "Salicylic acid raises sun sensitivity less than AHAs do, but daily sunscreen is still the sensible pairing.",
    evidenceTier: "B",
  },
  {
    group: "vitamin_c",
    photosensitising: false,
    preferredTime: "am",
    reason:
      "Vitamin C is an antioxidant — it isn't required to be used in the morning, but it complements sunscreen against daytime free-radical damage.",
    evidenceTier: "B",
  },
];

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface RoutineStepInput {
  id: string;
  /** For display in findings. */
  label: string;
  timeOfDay: TimeOfDay;
  /** INCI names; position is irrelevant here — presence is what matters. */
  ingredients: string[];
  /** Canonical category, used to detect whether the routine has a sunscreen. */
  category?: string | null;
}

export interface CompatibilityFinding {
  code: string;
  severity: Severity;
  title: string;
  explanation: string;
  recommendation: string;
  evidenceTier: EvidenceTier;
  /** Step labels involved, so the UI can point at real products. */
  steps: string[];
  ingredients: string[];
}

export interface CompatibilityReport {
  verdict: "no_clashes" | "minor_clashes" | "major_clashes";
  findings: CompatibilityFinding[];
  /** Reassurances about pairs users often believe are problems. */
  reassurances: { code: string; note: string }[];
}

interface StepGroups {
  step: RoutineStepInput;
  groups: Map<ActiveGroup, string[]>;
}

function classify(step: RoutineStepInput): StepGroups {
  const groups = new Map<ActiveGroup, string[]>();
  for (const name of step.ingredients) {
    for (const group of groupsForIngredient(name)) {
      groups.set(group, [...(groups.get(group) ?? []), name]);
    }
  }
  return { step, groups };
}

/** Do two steps ever land on the skin at the same time of day? */
function overlaps(a: TimeOfDay, b: TimeOfDay): boolean {
  if (a === "both" || b === "both") return true;
  return a === b;
}

/** Does this step run in the morning? */
function isMorning(t: TimeOfDay): boolean {
  return t === "am" || t === "both";
}

/**
 * Analyse a routine for clashes and misplaced actives.
 *
 * Pure and deterministic: the same routine always yields the same findings, in
 * the same order.
 */
export function analyzeRoutine(steps: RoutineStepInput[]): CompatibilityReport {
  const classified = steps.map(classify);
  const findings: CompatibilityFinding[] = [];

  // -- Pairwise interactions ------------------------------------------------
  for (let i = 0; i < classified.length; i++) {
    for (let j = i + 1; j < classified.length; j++) {
      const first = classified[i];
      const second = classified[j];

      for (const rule of INTERACTIONS) {
        // A rule can match either way round.
        const combos: [string[] | undefined, string[] | undefined][] = [
          [first.groups.get(rule.a), second.groups.get(rule.b)],
          [first.groups.get(rule.b), second.groups.get(rule.a)],
        ];
        for (const [left, right] of combos) {
          if (!left?.length || !right?.length) continue;
          if (rule.sameTimeOnly && !overlaps(first.step.timeOfDay, second.step.timeOfDay)) {
            continue;
          }
          if (findings.some((f) => f.code === rule.code
            && f.steps.includes(first.step.label)
            && f.steps.includes(second.step.label))) {
            continue;
          }
          findings.push({
            code: rule.code,
            severity: rule.severity,
            title: `${first.step.label} + ${second.step.label}`,
            explanation: rule.mechanism,
            recommendation: rule.recommendation,
            evidenceTier: rule.evidenceTier,
            steps: [first.step.label, second.step.label],
            ingredients: [...new Set([...left, ...right])],
          });
        }
      }
    }
  }

  // -- Usage rules: wrong time of day ---------------------------------------
  for (const { step, groups } of classified) {
    for (const rule of USAGE_RULES) {
      const hits = groups.get(rule.group);
      if (!hits?.length) continue;

      if (rule.preferredTime === "pm" && isMorning(step.timeOfDay)) {
        findings.push({
          code: `${rule.group}_in_am`,
          severity: "minor",
          title: `${step.label} is scheduled for the morning`,
          explanation: rule.reason,
          recommendation:
            step.timeOfDay === "both"
              ? "Move this to evenings only."
              : "Move this to your evening routine.",
          evidenceTier: rule.evidenceTier,
          steps: [step.label],
          ingredients: hits,
        });
      }
    }
  }

  // -- Usage rules: photosensitising active with no daytime sunscreen -------
  // The question that motivated all of this: "retinol makes skin sun-sensitive,
  // so is there an SPF in the routine to cover it?"
  const hasMorningSunscreen = classified.some(
    ({ step, groups }) =>
      isMorning(step.timeOfDay) &&
      (step.category === "sunscreen" || groups.has("sunscreen" as ActiveGroup)),
  );

  if (!hasMorningSunscreen) {
    const photosensitising = USAGE_RULES.filter((r) => r.photosensitising).map((r) => r.group);
    const exposed = classified.flatMap(({ step, groups }) =>
      photosensitising
        .filter((group) => groups.has(group))
        .map((group) => ({ step, group, hits: groups.get(group)! })),
    );

    if (exposed.length) {
      findings.push({
        code: "photosensitiser_without_spf",
        severity: "major",
        title: "No daytime sunscreen alongside a sun-sensitising active",
        explanation:
          "Retinoids and exfoliating acids leave skin more vulnerable to UV, and the effect lasts through the following day — not just while the product is on. Without daytime sun protection you can end up with more pigmentation than the active is treating.",
        recommendation:
          "Add a broad-spectrum SPF 30 or higher to your morning routine. It's the single step that makes everything else here worth doing.",
        evidenceTier: "A",
        steps: [...new Set(exposed.map((e) => e.step.label))],
        ingredients: [...new Set(exposed.flatMap((e) => e.hits))],
      });
    }
  }

  // -- Reassurances ---------------------------------------------------------
  const reassurances: { code: string; note: string }[] = [];
  for (const pair of DEBUNKED_PAIRS) {
    const hasA = classified.some((c) => c.groups.has(pair.a));
    const hasB = classified.some((c) => c.groups.has(pair.b));
    if (hasA && hasB) reassurances.push({ code: pair.code, note: pair.note });
  }

  const severityRank = (s: Severity) => (s === "major" ? 0 : 1);
  findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return {
    verdict: findings.some((f) => f.severity === "major")
      ? "major_clashes"
      : findings.length
        ? "minor_clashes"
        : "no_clashes",
    findings,
    reassurances,
  };
}
