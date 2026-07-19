# SkinSavior assessment architecture

Design for the onboarding questionnaire and the data it feeds. Supersedes the
7-question v2 survey in `apps/web/src/app/quiz/page.tsx`.

Grounded in the validated instruments surveyed in July 2026 — see
[Evidence basis](#evidence-basis) for what was adopted, what was rejected, and
why.

---

## 1. Design principles

**Phased, not long.** Every question before the signup wall is a place to lose a
user who hasn't seen value yet. The core quiz produces a *provisional* profile;
depth is earned after signup and after the user has a reason to care.

**Measure, don't diagnose.** Online symptom checkers misdiagnose rashes ~69% of
the time. We capture observations and either (a) act on them via rules or
(b) route to a dermatologist. We never name a condition.

**Only ask what changes an output.** Every question below maps to a specific
gate, score input, or rule. A question that changes nothing gets cut.

**Contraindications are gates, not penalties.** Pregnancy cannot be "-20 match
score." It removes products from the candidate set entirely.

**User free text never becomes catalog data.** See §4.3.

---

## 2. Phase structure

| Phase | When | Gate | Purpose |
|---|---|---|---|
| **0 · Core** | Pre-signup | Required | Produces a usable provisional profile |
| **1 · Routine** | Pre-signup, skippable | Optional | What you use and when → conflict detection |
| **2 · Depth** | Post-signup, contextual | Triggered | Precision where it matters |
| **3 · Commerce** | Post-signup | Deferred | Budget, brand preference |

### Phase 0 — Core (pre-signup, required)

Target: ~12–15 interactions. Produces enough to score against.

1. **Safety gate** — pregnant / breastfeeding / trying to conceive / none.
   Hard gate. Drives retinoid + hydroquinone exclusion and salicylic acid
   concentration limits.
2. **Red-flag screen** — one multi-select for lesions that are new, changing,
   spreading, painful, or bleeding; plus eye pain / light sensitivity / vision
   change. Any hit → referral card, and recommendations are framed as
   supplementary rather than primary.
3. **Dry ↔ Oily axis** — ~5 items. The most reliable Baumann axis (ICC 0.91).
   Own wording; see §5 on licensing.
4. **Sensitive ↔ Resistant axis** — ~5 items. Most reliable axis (ICC 0.96).
5. **Primary concerns** — multi-select, max 3. Ranks which rules and which
   evidence surfaces get priority.
6. **Age range** — coarse. Modifies concern priors only.

Deliberately **not** in Phase 0: budget, routine length preference, brand
preference. These are commerce questions asked before credibility is
established — they move to Phase 3.

### Phase 1 — Routine capture (pre-signup, skippable)

"What are you using right now?" — catalog search **plus free-text entry**
(§4.3), each entry tagged with time of day and frequency.

This is the highest-value phase in the whole assessment and it costs the user
very little, because people can list their routine from memory faster than they
can introspect about skin traits. It is the sole input to conflict detection
(§6), which delivers value *before* any recommendation exists.

Anonymous users stash to localStorage and flush on signup, mirroring
`lib/quiz-answers.ts`.

### Phase 2 — Depth (post-signup, contextual triggers)

| Module | Trigger |
|---|---|
| **SS-10** (full 10-item sensitivity scale) | User reports a reaction, or Phase 0 sensitivity is borderline |
| **Reaction history** | User marks a product as "didn't work" |
| **Pigmentation / Fitzpatrick (coarse)** | User's concerns include dark spots / uneven tone, or is recommended an acid or a retinoid |
| **Barrier state** | SS-10 profile skews to tautness + stinging |

Contextual triggering is what keeps total depth high while keeping any single
sitting short.

### Phase 3 — Commerce (post-signup)

Budget bands, brand preferences, retailer preferences. Filters, not score
inputs.

---

## 3. Instrument choices

### 3.1 Skin type — two axes, not four

The Baumann system defines four axes. Validation studies show reliability is
**not** uniform:

| Axis | Reliability | Decision |
|---|---|---|
| Dry ↔ Oily | ICC 0.91 | **Adopt** |
| Sensitive ↔ Resistant | ICC 0.96 | **Adopt** |
| Pigmented ↔ Non-pigmented | Weak | Phase 2 only, low confidence weight |
| Wrinkled ↔ Tight | **17–18% accuracy** | **Reject** |

The wrinkle axis performs at chance. Shipping it would mean confidently telling
users something we have no basis for, which costs credibility on everything
else. Aging-related guidance should key off age + concern selection instead.

### 3.2 Sensitivity — SS-10

Ten facial symptoms over the **last 3 days**, each rated 0–10, total 0–100:

> irritability · stinging · burning · heat · tautness · itching · pain ·
> discomfort · flushes · redness

Published cut-offs: **> 13** = sensitive skin, **< 5** = not sensitive,
between = slightly sensitive.

Two reasons this beats the current 3-option question:

1. **Continuous score with validated thresholds**, not three buckets.
2. **Symptom profile, not just severity.** High flushing + heat suggests
   vascular reactivity; high tautness + stinging suggests barrier impairment.
   Those imply different products. The current question cannot distinguish them.

**Recall window caveat:** SS-10 measures the last 3 days — current state, not
trait. Store each administration as a dated row (§4.1), never overwrite. Re-prompt
periodically rather than treating one score as permanent.

### 3.3 Fitzpatrick — coarse use only

Self-reported Fitzpatrick has poor internal consistency (α ≈ 0.515) and
self-reported race/pigmentary phenotype are weak predictors of true sun
sensitivity. Use it for UV messaging and post-inflammatory hyperpigmentation
risk when recommending acids or retinoids. Do **not** present it as precise and
do not weight it heavily in scoring.

---

## 4. Data model

### 4.1 `skin_assessments` — versioned, not overwritten

Current design writes quiz answers onto `profiles` columns, which destroys
history. Answers legitimately change, and SS-10 is explicitly a point-in-time
measure.

```sql
create table skin_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  taken_at timestamptz not null default now(),
  instrument_version text not null,        -- 'core-v3', 'ss10-v1'
  answers jsonb not null,                  -- raw, for reprocessing
  -- derived, denormalized for query speed
  dry_oily_score int,                      -- normalized axis position
  sensitive_resistant_score int,
  ss10_total int,                          -- 0..100, null if not administered
  ss10_items jsonb,                        -- per-symptom, drives the profile split
  primary_concerns text[],
  created_at timestamptz not null default now()
);
```

`profiles` keeps a `current_assessment_id` pointer so hot paths don't aggregate.
Keeping raw `answers` means a scoring change can be re-run over history without
re-surveying anyone.

### 4.2 `product_reactions` — "what didn't work"

`product_ratings` already exists but is the wrong shape: a star rating cannot
express purging vs. true reaction, how long the product was used, or which
symptom appeared. Those distinctions are the entire value of the question.

```sql
create table product_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id),   -- nullable: may be free text
  custom_name text,                          -- user-typed, unresolved
  symptom text not null check (symptom in (
    'breakout','redness','stinging','itching','dryness','peeling',
    'oiliness','no_effect','other')),
  onset text check (onset in ('immediate','days','weeks')),
  used_for text check (used_for in ('under_2_weeks','2_8_weeks','over_8_weeks')),
  stopped boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  constraint reaction_identifies_product
    check (product_id is not null or custom_name is not null)
);
```

`onset` + `used_for` are what let the system distinguish retinoid purging
(breakout, weeks, still using) from a true intolerance (stinging, immediate,
stopped) — a distinction that materially changes the advice.

### 4.3 Free-text products — the containment rule

**User-typed product names must never create rows in `products` or
`ingredients`.** The catalog already contains junk from unvalidated ingest (a
row of French marketing copy sits among the 2,332 ingredients). User free text
is lower quality than page extraction and would be worse.

Instead, extend `routine_steps`:

```sql
alter table routine_steps add column if not exists custom_name text;
alter table routine_steps add column if not exists custom_brand text;
alter table routine_steps add constraint step_identifies_product
  check (product_id is not null or custom_name is not null);
```

Free-text steps are **owned by the user, invisible to the catalog**. A later
resolver pass can:

1. trigram-match `custom_brand || ' ' || custom_name` against `products`
   (the `find_similar_products` RPC already exists), and
2. on a confident match, set `product_id` and keep `custom_name` for audit.

Unresolved entries still work for the user's own routine display. They simply
can't participate in ingredient-level rules — which is the honest outcome,
since we don't know their formula. The UI should say so rather than silently
skipping them.

This also closes a doc/schema drift: `docs/ai-pipeline.md` §2 already describes
reading "the `custom_name` as an opaque string," against a column that was
never built.

### 4.4 Anonymous capture

Phases 0 and 1 run pre-signup. Extend the existing localStorage stash
(`lib/quiz-answers.ts`) to carry assessment answers *and* provisional routine
steps, then flush both on first authenticated load. `PendingAnswersFlush`
becomes the single flush point for all pre-signup capture.

---

## 5. Licensing

The Baumann Skin Type Indicator is a **commercial instrument** (Skin Type
Solutions); its 64 items are proprietary. We do not copy them. We write our own
items targeting the same two well-validated constructs, and cite the validation
literature as the basis for the construct choice and the axis reliability
figures. SS-10's ten items are published symptom descriptors and are cited
directly.

---

## 6. What the data unlocks: conflict detection

The cheapest, highest-value feature this enables. **No scoring model, no model
call** — pure rules over `routine_steps.time_of_day` joined through
`product_ingredients` to `ingredients`.

| Rule | Basis | Confidence |
|---|---|---|
| Retinoid scheduled AM | Retinoids photodegrade; well documented | **High** |
| No sunscreen in an AM routine that contains a retinoid or AHA/BHA | Photosensitivity | **High** |
| Pregnancy gate: retinoid / hydroquinone present | ACOG; hydroquinone 35–45% systemic absorption | **High — blocking** |
| Salicylic acid > 2% leave-on during pregnancy | Concentration-dependent | Medium |
| Multiple leave-on exfoliating acids same session | Cumulative irritation | Medium |
| Benzoyl peroxide + retinoid | **Formulation-dependent** — BP oxidizes tretinoin, but adapalene is stable with BP and is co-formulated commercially | **Low — inform, never warn** |

The BP row is the important one. A blanket "don't mix BP and retinoids" warning
would be wrong often enough that users who know the literature will stop
trusting the rest. Every rule ships with a severity **and** a confidence tier,
and low-confidence rules are phrased as context, not correction.

Conflict detection should ship **before** the match scorer. It produces value
from the routine data alone, needs no catalog completeness, and its output is
fully explainable — a good trust-builder to lead with.

---

## 7. Build order

1. `routine_steps.custom_name` + free-text entry in the routine builder
2. Anonymous routine capture in the quiz (Phase 1) — reuses the stash pattern
3. Conflict rules over existing data (§6) — first user-visible payoff
4. `skin_assessments` table + Phase 0 rewrite
5. `product_reactions` + the "didn't work" flow (Phase 2 trigger)
6. Match scorer, consuming all of the above

Steps 1–3 deliver a working feature without touching the quiz, which de-risks
the larger Phase 0 rewrite behind it.

---

## Evidence basis

Adopted:
- Baumann Skin Type Indicator — construct and axis reliability
  ([validation](https://www.scirp.org/journal/paperinformation?paperid=64499),
  [overview](https://pubmed.ncbi.nlm.nih.gov/18555952/),
  [Polish validation pt. 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC12262028/),
  [Indonesian validation](https://pmc.ncbi.nlm.nih.gov/articles/PMC13046154/))
- Sensitive Scale-10
  ([original](https://pubmed.ncbi.nlm.nih.gov/24710717/),
  [cut-off scores](https://pmc.ncbi.nlm.nih.gov/articles/PMC9309873/))

Constrained:
- Fitzpatrick self-report reliability
  ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4165764/),
  [Advances in Skin & Wound Care](https://journals.lww.com/aswcjournal/fulltext/2020/12000/validity_of_the_fitzpatrick_skin_phototype.11.aspx))

Rules and safety:
- [Tretinoin/BP formulation stability](https://pmc.ncbi.nlm.nih.gov/articles/PMC2958193/)
- [Skin care safety in pregnancy](https://pmc.ncbi.nlm.nih.gov/articles/PMC3114665/),
  [InfantRisk overview](https://www.infantrisk.com/content/overview-safety-skin-care-products-during-pregnancy)
- [AAD on health apps and diagnosis](https://www.aad.org/public/fad/digital-health/apps)
