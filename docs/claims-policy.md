# Claims Policy

> **Not legal advice.** This document describes design constraints derived from
> the FDA/FTC regulatory landscape so the Evidence Explainer can be built on the
> safe side of the line. Have a qualified reviewer sign off before launch.

## Why this exists

SkinSavior earns affiliate revenue (YesStyle). That makes the Evidence Explainer
**commercial content**, so two regimes apply at once:

- **FTC** — any claim we make must be substantiated, and the *net impression* of
  the whole experience is judged, not individual hedged sentences.
- **FDA** — a cosmetic that claims to affect the structure or function of the
  body, or to treat a disease, is regulated as a **drug**. We must not cross that
  line in how we phrase things.

The core discipline: **we report on the evidence; we do not assert that a product
works.** "Two small trials suggest…" is a statement about evidence. "This reduces
wrinkles" is a product-efficacy claim. Only the first is allowed.

## Claim typing

Every claim carries a `claim_type` (`claims.claim_type`), derived from its badge
(see "The badge vocabulary" below) — never set by hand or by the LLM. It
determines how the claim may ever be rendered.

| Type | What it is | Examples | Rule |
|---|---|---|---|
| `cosmetic` | Appearance / surface effects | "helps even out the look of tone", "improves the look of pores", "moisturizes" | Allowed. Keep phrasing about *appearance* ("the look of"). |
| `borderline` | Structure-function phrasing | "supports collagen", "reduces inflammation", "boosts barrier repair" | Restrict to **evidence-framing** only ("studies measured increased collagen mRNA"), never product-efficacy framing ("boosts your collagen"). |
| `prohibited` | Disease claims | "treats acne", "clears eczema", "cures rosacea" | **Never** rendered as a product claim. |

**The disease trap:** acne, eczema, rosacea, psoriasis and dermatitis are exactly
the conditions most skincare research studies. A study can be perfectly real and
still make its claim `prohibited` — because naming the disease as something the
*product* does is a drug claim. Such studies may still exist in the library as
provenance; the claim they attach to is typed `prohibited` and is not surfaced as
a product benefit.

## The badge vocabulary

Claims are not free text. A claim is an (ingredient, badge) pair, where the
badge comes from the fixed vocabulary in
`packages/core/src/research/claim-badges.ts`. Each badge owns its consumer-facing
card text, its chip label, and its `claim_type` — so the compliance
classification of every possible claim is decided once, in reviewed code. The
Stage-1 extractor's schema is an enum of badge slugs: the model can only sort a
paper's finding into an existing bucket, never invent a new claim or reword one.
Two papers describing the same benefit in different words land on the same badge
and stack as evidence behind a single claim.

The `prohibited` badges (`studied-for-acne`, `studied-for-rosacea`,
`studied-for-eczema`, `studied-for-other-condition`) are the outlet for the
disease trap below: they give a real acne trial a place to be filed as
provenance while guaranteeing it is never rendered as a benefit.

Adding a badge is a product/compliance decision, not an extraction-time event:
extend the catalog in code and relax the `claims.badge_slug` check constraint in
a migration.

## The Level-5 floor

The grading engine caps any claim whose evidence is only CEBM Level 5
(in vitro, ex vivo, animal — mechanism-only) at **very_limited**, regardless of
effect size or study count (see `packages/core/src/research/grading.ts`). This is
both scientifically honest and the FTC's own line: mechanism studies in a dish
cannot substantiate a human benefit claim on their own. The "very_limited" label
quietly tells a user "this is basically marketing, not science" without those
words.

## How the stages enforce this

- **Ingestion (Stage 1):** capture `funding_source`, `conflict_flag`,
  `concentration` (for indirectness) and sort each finding into a badge from the
  fixed vocabulary. Extraction reports fields only — it never concludes a
  product works, and it cannot author or type a claim.
- **Grading (Stage 2):** the deterministic, auditable grade *is* the
  substantiation discipline. "Our rules engine downgraded this for indirectness"
  is defensible; "the AI decided" is not. The grade is derived by code only —
  never by an LLM, never by hand (`claims.certainty` is written solely by
  `grading-db.ts`).
- **Runtime (Stage 3, later):** the explainer LLM may reference only studies in
  its input, must phrase everything as statements about *evidence* not the
  product, and must not use disease or structure-function language. Output passes
  a disallowed-phrase filter (treats, cures, prevents, heals, and
  structure-function verbs tied to a product) and is logged for audit. An
  affiliate material-connection disclosure sits wherever a claim is near a
  monetized link, alongside a standing "educational, not medical advice, consult a
  professional" note.

## The net-impression rule

The FTC judges the whole experience. A hedged paragraph next to a glowing product
card and a buy button can still read as a claim. **Design the surrounding UI, not
just the copy** — keep the Evidence Explainer visually separable from the buy
action, and attach every evidence label to the *evidence*, not to the product.
