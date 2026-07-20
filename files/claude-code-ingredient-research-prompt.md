# Claude Code prompt — Ingredient Research integration

Paste everything below the line into Claude Code from the repo root, with `docs/ingredient-research-spec.md` committed.

---

You are a senior full-stack engineer implementing a new feature in an existing Turborepo monorepo. Read `docs/ingredient-research-spec.md` in full before writing any code. It is the source of truth; where this prompt and the spec conflict, the spec wins.

## Task

Implement the full ingredient-research feature end to end: a cached PubMed retrieval pipeline plus two UI surfaces (ingredient profile page and product page). This feature is retrieval and display only. Do NOT build any AI grading, tiering, or evidence summarization. Study type comes from PubMed metadata, not an LLM.

## Repo context

- Turborepo: `apps/web` (Next.js 15, App Router), `apps/mobile` (Expo/React Native), `packages/core` (shared logic, types, Zod, Supabase client), `packages/ui`.
- TypeScript end to end. Zod for validation. TanStack Query for data fetching.
- Supabase with RLS. This feature requires a NEW migration (two new tables) — that is expected and allowed here, unlike the explainer feature.

## Order of work — show the plan and pause after each numbered step for my go-ahead

1. **Audit.** Report:
   - Where ingredients live (table, id type, name field).
   - Where products live and how a product's "star ingredients" are determined — is there a flag, an actives list, a join table, or nothing explicit? The product-page toggle depends on this. If there is no clear notion of star ingredients, STOP and tell me; do not invent one.
   - Whether `packages/ui` is cross-platform (react-native-web / Tamagui) or web-only. This decides where the components live. If web-only or unclear, put the React components in `apps/web` and keep only the data layer in `packages/core`.
   Do not proceed past this step without reporting.

2. **Migration.** Create the `research_papers` and `ingredient_research_meta` tables exactly as specced in section 4, including the unique constraint and RLS policies (public read; writes via service role only). Do not modify existing tables.

3. **`packages/core`: PubMed client.** A function `fetchPubMedPapers(ingredientName): Promise<Paper[]>` that:
   - Builds the domain-scoped query from spec section 2 (expose the scope clause as a tunable constant).
   - Calls `esearch` (`retmode=json`) to get top-5 PMIDs sorted by relevance.
   - Calls `efetch` (`retmode=xml`) and parses with `fast-xml-parser` (install it).
   - Returns the typed `Paper[]` shape from spec section 3, building `pubmed_url` from the PMID and extracting `doi` and `publication_types` when present.
   - Includes `tool` and `email` params and an optional `NCBI_API_KEY` from env. Handle the no-results and API-error cases without throwing uncaught.
   Add the `Paper` Zod schema and type here. Unit-test the XML parsing against a saved sample efetch response so it does not depend on the live API.

4. **`packages/core`: cache layer.** `getIngredientResearch(ingredientId)` implementing the read flow in spec section 4: check meta freshness (30-day window constant), return cached rows if fresh, else fetch via the PubMed client, upsert the top 5 into `research_papers`, update `ingredient_research_meta` (including `status: 'empty'` when zero results), and return. On PubMed error, fall back to cached rows if any, else return empty with `status: 'error'`.

5. **`apps/web`: route.** `app/api/ingredients/[id]/research/route.ts` calling `getIngredientResearch`, returning the papers array. Validate the id param. This is the only thing the client calls; the client never touches PubMed.

6. **UI: shared card component.** `IngredientResearch({ ingredientId })` that fetches the route via TanStack Query and renders up to 5 cards per spec section 6: title (linking to DOI full text if present, else the PubMed URL, opening in a new tab with `rel="noopener noreferrer"`), journal and year, a study-type badge derived from `publication_types` (prefer the most significant type — Meta-Analysis or RCT over generic Journal Article), and an optional truncated abstract. Implement loading skeletons, an empty state, and an error fallback. If there are no papers, hide the section rather than showing an empty block.

7. **UI: ingredient profile page.** Add a "Research" section at the bottom rendering `<IngredientResearch ingredientId={id} />`.

8. **UI: product page.** Add a "Research" section at the bottom with a toggle (pills or tabs) listing the product's star ingredients (as resolved in step 1). Selecting one renders `<IngredientResearch>` for that ingredient. Default to the first star ingredient. Lazy-load each ingredient's data on selection rather than fetching all at once.

## Constraints

- Retrieval and display only. No LLM, no grading, no evidence tiers in this pass.
- New tables are fine; do not alter existing schema.
- PubMed key optional; caching means live calls are rare. Never call PubMed from the client.
- Use `fast-xml-parser` for efetch; `efetch` does not return JSON.
- Match the existing app's component styling and design tokens — inspect a comparable existing section before writing the cards; do not introduce a new visual language.
- Small, reviewable commits per step. Summarize after each and wait for my go-ahead.
- If anything is ambiguous (especially star ingredients), ask before implementing.

Start with step 1 and report your audit findings.
