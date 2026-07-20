/**
 * Stage-3 runtime explainer (Evidence Explainer spec section 8): turns one
 * claim's graded evidence into two-to-three sentences of plain-language prose
 * for the claim card.
 *
 * Split of responsibilities (docs/claims-policy.md):
 *   - This module is PURE: it builds the prompt and enforces the disallowed-
 *     phrase filter. Deterministic, unit-tested, no I/O, no SDK.
 *   - scripts/generate-explainers.mjs owns the Gemini call and persists every
 *     generation (pass or fail) to `claim_explainers`, which is the audit log.
 *   - The read layer surfaces only rows that passed the filter and are fresher
 *     than the claim's grade.
 *
 * The LLM may reference only the studies in its input, must phrase everything
 * as statements about the *evidence* (never the product), and must not use
 * disease or structure-function language. The filter is the hard backstop for
 * those rules — prose that trips any rule is logged but never rendered.
 */

// 2.5-flash-lite is retired for new API users (404s); 3.1-flash-lite is the
// current stable lite tier.
export const EXPLAINER_MODEL = "gemini-3.1-flash-lite";

export interface ExplainerStudyInput {
  /** Consumer-safe design tag, e.g. "Randomized trial" (DESIGN_TIER_LABELS). */
  tierLabel: string;
  title: string;
  sampleSize: number | null;
}

export interface ExplainerClaimInput {
  /** Badge chip label, e.g. "Evens tone". */
  badgeLabel: string;
  /** Card headline from the badge catalog. */
  cardText: string;
  /** Consumer certainty label, e.g. "Moderate evidence". */
  certaintyLabel: string;
  /** The grading engine's consumer-safe reason texts. */
  reasons: string[];
  /** Accepted studies behind the grade — the ONLY sources the model may cite. */
  studies: ExplainerStudyInput[];
}

export interface PhraseViolation {
  /** Stable rule code for the audit log. */
  code: string;
  /** The offending text as matched. */
  match: string;
}

interface PhraseRule {
  code: string;
  pattern: RegExp;
}

/**
 * The disallowed-phrase rules. Each encodes one line from the claims policy:
 *
 *  drug_verb            — treats/cures/prevents/heals etc. are drug claims in
 *                         any framing, including study description.
 *  disease_term         — naming a disease near a product is the disease trap;
 *                         prose must say "dark patches", not "melasma".
 *  structure_function   — a present-tense verb acting on a body structure
 *                         ("boosts collagen") asserts the effect as fact.
 *                         Past/noun forms stay legal so evidence framing like
 *                         "studies measured increased collagen mRNA" passes.
 *  second_person_structure — "your collagen/barrier" ties the effect to the
 *                         reader's body: product-efficacy framing.
 *  product_promise      — "will smooth", "proven to", "clinically proven"
 *                         promise an outcome instead of describing evidence.
 *  efficacy_assertion   — "is effective/proven" asserts efficacy as settled.
 */
const PHRASE_RULES: PhraseRule[] = [
  {
    code: "drug_verb",
    pattern:
      /\b(treats?|treated|treating|cures?|cured|curing|heals?|healed|healing|prevents?|prevented|preventing|reverses?|reversed|reversing)\b/gi,
  },
  {
    code: "disease_term",
    pattern:
      /\b(acne|eczema|rosacea|psoriasis|dermatitis|melasma|wounds?|infections?)\b/gi,
  },
  {
    code: "structure_function",
    pattern:
      /\b(boosts|stimulates|increases|rebuilds|repairs|regenerates|strengthens|restores)\s+(?:\w+\s+){0,3}?(collagen|elastin|barrier|cells?|dna|turnover)\b/gi,
  },
  {
    code: "second_person_structure",
    pattern: /\byour\s+(collagen|elastin|barrier|cells?|skin\s+barrier)\b/gi,
  },
  {
    code: "product_promise",
    pattern:
      /\b(will\s+(?:\w+\s+){0,2}?(reduce|improve|fade|firm|smooth|brighten|clear)|proven\s+to|clinically\s+proven)\b/gi,
  },
  {
    code: "efficacy_assertion",
    pattern: /\b(is|are)\s+(effective|proven)\b/gi,
  },
];

/**
 * Run the disallowed-phrase filter. Empty `violations` means the text is safe
 * to render; anything else is logged to the audit table and never shown.
 */
export function checkExplainerText(text: string): {
  ok: boolean;
  violations: PhraseViolation[];
} {
  const violations: PhraseViolation[] = [];
  for (const rule of PHRASE_RULES) {
    // Fresh lastIndex per call — the patterns are /g/ for matchAll.
    for (const m of text.matchAll(rule.pattern)) {
      violations.push({ code: rule.code, match: m[0] });
    }
  }
  return { ok: violations.length === 0, violations };
}

const SYSTEM = `You write one short explanation of the scientific evidence behind a skincare ingredient claim for SkinSavior, an evidence-focused skincare app. You describe evidence; you never sell.

Hard rules:
- Two to three sentences, at most 60 words, plain conversational language a non-scientist follows.
- Every sentence is a statement about the EVIDENCE (what studies exist, what they measured, their limits) — never about what a product or ingredient does or will do for the reader.
- Reference only the studies listed in the input. Never invent, count differently, or import outside knowledge.
- Reflect the stated evidence grade and its reasons honestly — if the evidence is thin, say so plainly.
- Never use the words: treat, cure, prevent, heal, reverse (any form).
- Never name a disease or medical condition (acne, eczema, rosacea, melasma, dermatitis, psoriasis...). Describe appearance instead ("dark patches", "breakout-prone skin").
- Never assert an effect on body structures as fact ("boosts collagen", "repairs your barrier"). Frame as what studies measured ("studies measured increased collagen production").
- No promises ("will smooth"), no "proven", no "effective".`;

/**
 * Build the Gemini prompt for one claim. Returns system instruction and user
 * content separately (maps to systemInstruction/contents in the GenAI SDK).
 */
export function buildExplainerPrompt(input: ExplainerClaimInput): {
  system: string;
  user: string;
} {
  const studyLines = input.studies
    .map(
      (s, i) =>
        `${i + 1}. [${s.tierLabel}${s.sampleSize != null ? `, n=${s.sampleSize}` : ""}] ${s.title}`,
    )
    .join("\n");

  const user = `Claim: ${input.cardText} (badge: ${input.badgeLabel})
Evidence grade: ${input.certaintyLabel}
Grading reasons:
${input.reasons.map((r) => `- ${r}`).join("\n")}

Studies behind this grade (the only sources you may describe):
${studyLines}

Write the explanation now.`;

  return { system: SYSTEM, user };
}
