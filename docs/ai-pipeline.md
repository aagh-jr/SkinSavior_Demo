# SkinSavior AI pipeline architecture

Three AI features share one data foundation. This doc records what's built,
what's designed-but-not-built, and where retrieval (RAG) actually sits in each.

| Feature | Status | Entry point |
|---|---|---|
| 1. URL → product page ingest | **Built** | `POST /api/products/ingest`, UI at `/add` |
| 2. Routine compatibility analysis | Schema + design (this doc) | `POST /api/routines/[id]/compatibility` (future) |
| 3. Skin logs → rolling profile summary | Schema + design (this doc) | cron/route TBD |

All model calls use `claude-opus-4-8` with structured outputs validated against
the shared Zod schemas in `packages/core/src/schemas/claude.ts` — nothing a
model produces is stored or rendered without passing schema validation.

---

## 1. URL ingest (built)

```
paste URL → canonicalize → product_sources exact match? ──yes→ redirect to slug
                                   │ no
                          fetch page, strip to text (JSON-LD kept)
                                   │
                     Claude extraction (productExtractionSchema)
                                   │
              trigram similarity vs products (find_similar_products RPC)
                  │ ≥ 0.65                      │ < 0.65
        attach URL to existing product     insert product + ingredients
        return existing slug               return new slug
```

Key decisions:
- **Dedupe is two-tier**: exact URL match (cheap, no model call) then trigram
  similarity on `brand + name` after extraction. pgvector embeddings can
  replace the trigram step later without changing the route's shape.
- **Ingested products are labeled** `source = 'ai_extracted'` and the page
  shows an "AI-extracted — not yet reviewed" badge. Marketing claims are
  stored verbatim in `products.claims` as *unevaluated* input for the future
  evidence-grading pass — the extraction prompt forbids evaluating them.
- **Ingredients are normalized once** into the `ingredients` table
  (`normalized_name` generated column, unique). Every product links to the
  same ingredient row — this is what makes feature 2 possible.

## 2. Routine compatibility (designed)

Output contract already exists: `compatibilityAnalysisSchema` — a verdict
(`no_clashes | minor_clashes | major_clashes`) plus findings, each with
severity, mechanism, who's affected, a recommendation, and an **evidence tier
(A–D)** so "vitamin C + retinol" folklore is distinguishable from documented
interactions.

### Where RAG fits (and where it doesn't)

The context needed per analysis is small and structured — this is mostly
**deterministic retrieval by joins**, not vector search:

1. **Candidate product** → its ingredient rows (`product_ingredients` join).
2. **User routine** → for each `routine_steps` row, the linked product's
   ingredients (or the `custom_name` as an opaque string).
3. **Interaction knowledge base** → the one place retrieval genuinely matters.
   Build a curated `ingredient_interactions` table:

   ```sql
   create table ingredient_interactions (
     id uuid primary key,
     ingredient_a text not null,   -- normalized names or class names ('AHA')
     ingredient_b text not null,
     severity text check (severity in ('minor','major')),
     mechanism text not null,
     evidence_tier text check (evidence_tier in ('A','B','C','D')),
     citations jsonb not null default '[]',  -- [{title, url}]
     embedding vector(1024)        -- pgvector, for class-level fuzzy lookup
   );
   ```

   Lookup is exact-match on normalized pairs first, embedding search second
   (catches "glycolic acid" ~ "AHA class"). Rows are seeded from published
   dermatology sources, and the model must cite retrieved rows — **the model
   reasons over the knowledge base, it is not the knowledge base**. That is
   the guardrail against hallucinated interactions.
4. **Skin profile context** → the user's quiz profile plus the rolling
   `skin_profile_summaries.summary` from feature 3 (so "sensitive users
   might find this bad" becomes "you reported stinging with BHA in May").

Prompt assembly order (stable → volatile, for prompt caching):
system prompt (frozen) → interaction KB rows retrieved for these ingredients →
routine ingredient lists → candidate product → user summary.

### Why it waits

The analysis is only as good as routine data, and `routine_steps` barely has
UI yet. Build order: routine builder UI → seed `ingredient_interactions`
(~50 well-documented pairs covers most real routines) → the route itself,
which at that point is ~150 lines in the shape of the ingest route.

## 3. Skin logs → AI context (designed)

The right mental model: **the AI doesn't "learn" from logs; prompts get a
better context block.** No fine-tuning, no training — a summarization loop:

```
daily log UI ──► skin_logs (structured: reactions[], rating, routine_id, notes)
                     │  every N new logs (or nightly cron)
                     ▼
     Claude summarization (skinProfileSummarySchema)
     input: last ~90 days of logs + previous summary
                     ▼
     skin_profile_summaries (one row per user, overwritten)
                     │
                     ▼
   injected into feature-2 prompts and future match-score prompts
```

Decisions already locked into the migration:

- **Structured over free-text.** `reactions` is a checked enum array
  (stinging, redness, breakout, sunburn, …) + 1–5 rating + optional notes.
  Structured fields make the summarizer reliable and let you show trend charts
  without any model call; notes catch what the enum misses.
- **One log per user per day** (`unique(user_id, log_date)`) — upsert
  semantics, trivially simple UI ("how was your skin today?").
- **Logs reference the routine used** (`routine_id`), which is what lets the
  summarizer correlate reactions with actual ingredients via the joins above.
- **Summaries carry `data_quality`** (`sparse|moderate|rich`) so downstream
  prompts know how much to trust them — 3 logs should not drive
  recommendations the way 90 do.
- Raw logs stay owner-scoped under RLS; the summary is written only by the
  server (service role) and readable only by its owner.

Cost note: summarization is one model call per user per N logs — batchable via
the Batches API at 50% price if it ever matters.

---

## Operational setup

1. Apply the migration `supabase/migrations/20260702000000_products_ingest_and_ai_pipeline.sql`
   (Supabase dashboard SQL editor, or `npx supabase db push`).
2. Regenerate types so the temporary untyped casts in
   `apps/web/src/lib/products-db.ts` can be removed:
   `npx supabase gen types typescript --linked > packages/core/src/supabase/types.ts`
3. Set `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in
   `apps/web/.env.local` (see `.env.example`).
