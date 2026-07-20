# Ingredient Research Spec

Feature: surface the top 5 research papers for a skincare ingredient, pulled live from PubMed, cached, and displayed as linked cards on ingredient and product pages.
Status: spec, not yet implemented.
Scope: retrieval and display only. No AI grading in this feature. Grading is a separate, later layer that will build on this data.

Model/AI: none. This feature is pure data retrieval and rendering. Study type comes directly from PubMed metadata, not from an LLM.

---

## 1. What it does

Given an ingredient (for example "niacinamide"), the feature returns the 5 most relevant research papers from PubMed and renders them as cards. Each card links out to the paper.

Two display surfaces:
1. Ingredient profile page: a research section at the bottom showing 5 cards for that single ingredient.
2. Product page: a research section at the bottom with a toggle to switch between the product's star ingredients; selecting one shows that ingredient's 5 cards.

The card component is identical in both places. The product page just wraps it in an ingredient selector.

---

## 2. Data source: PubMed E-utilities

PubMed is the NIH's biomedical literature database. Free, no API key required (an optional key raises rate limits). It takes two calls:

1. `esearch` — send the ingredient query, get back a list of PubMed IDs (PMIDs). Use `retmode=json`.
2. `efetch` — send the PMIDs, get back full records including abstract, journal, year, and publication type. This returns XML only, so the response must be parsed with an XML parser (for example `fast-xml-parser`). `esummary` returns JSON but omits abstracts, so `efetch` is required.

Etiquette and limits:
- Include `tool` (app name) and `email` params on every request; NCBI asks for this.
- Support an optional `NCBI_API_KEY` env var. Without it, limit is 3 requests/second; with it, 10. Because results are cached (section 4), live calls are rare, so a key is not required for v1.

### Query construction

The search input is the ingredient name only (broad, per product decision). But a naive single-word query is a trap: many ingredients have large non-dermatology literatures (niacinamide appears in cancer and metabolic research). So the query keeps ingredient-level breadth while staying on-domain by scoping to skin/topical context:

```
"{ingredient}" AND (skin OR dermatology OR topical OR cutaneous)
```

Sort by relevance (PubMed default). Take the top 5 PMIDs. Expose the domain-scope clause as a tunable constant so it can be adjusted later without touching logic.

---

## 3. Data returned per paper

```json
{
  "pmid": "31838890",
  "title": "A double-blind study of niacinamide ...",
  "abstract": "first ~2 sentences or full abstract (nullable)",
  "journal": "Journal of Cosmetic Dermatology",
  "year": 2019,
  "publication_types": ["Randomized Controlled Trial"],
  "doi": "10.1111/jocd.xxxxx",
  "pubmed_url": "https://pubmed.ncbi.nlm.nih.gov/31838890/",
  "rank": 1
}
```

- `publication_types` comes straight from PubMed's `PublicationType` fields (Randomized Controlled Trial, Review, Meta-Analysis, Clinical Trial, etc.). This is what powers the study-type badge. No LLM classification needed.
- `pubmed_url` always exists (built from the PMID). `doi` is nullable; when present it enables a link to the original full text.
- `rank` is 1 to 5, preserving PubMed's relevance order for display.

---

## 4. Caching (important)

Research does not change hour to hour, and page loads must not call PubMed synchronously on every view (slow, and rate-limited). So fetch-on-miss-then-cache in Supabase.

New tables (migration required):

```
research_papers
├── id
├── ingredient_id        → ingredients (FK)
├── pmid                 text
├── title
├── abstract             nullable
├── journal              nullable
├── year                 int, nullable
├── publication_types    text[]
├── doi                  nullable
├── pubmed_url           text
├── rank                 int (1..5)
├── fetched_at           timestamp
└── unique (ingredient_id, pmid)

ingredient_research_meta
├── ingredient_id        → ingredients (FK, primary key)
├── last_fetched_at      timestamp
├── paper_count          int
└── status               ok | empty | error
```

The meta table lets us cache the empty case too (an ingredient with no results should not refetch on every load).

Read flow when a page requests an ingredient's research:
1. Check `ingredient_research_meta`. If fresh (last_fetched_at within the staleness window, for example 30 days), return the cached `research_papers` rows.
2. If missing or stale: call PubMed (esearch then efetch), parse, upsert the top 5 into `research_papers`, update meta, return.
3. On PubMed error: return whatever is cached; if nothing cached, return empty with status `error`.

RLS: `research_papers` and `ingredient_research_meta` are public read (this data is not user-specific). Writes happen only from the server route via the service role, never from the client.

---

## 5. API route

Server route in `apps/web`, for example `app/api/ingredients/[id]/research/route.ts`. Runs the read flow in section 4 and returns the array of papers. The client never calls PubMed directly.

---

## 6. UI

### Card component (shared)

`IngredientResearch` takes an ingredient identifier, fetches from the route via TanStack Query, and renders up to 5 cards. Each card shows:
- Title (links to `doi` full text if present, else `pubmed_url`)
- Journal and year
- Study-type badge from `publication_types` (show the most significant type, for example prefer "Meta-Analysis" or "Randomized Controlled Trial" over generic "Journal Article")
- Optional: first sentence or two of the abstract, truncated

States: loading skeleton (since a cache miss fetches live), empty state ("No research found for this ingredient yet"), and error fallback. The whole section hides gracefully if empty rather than showing a broken block.

### Ingredient profile page

At the bottom of the page: a "Research" section heading, then `<IngredientResearch ingredientId={id} />`.

### Product page

At the bottom of the page: a "Research" section with a toggle (pills or tabs) listing the product's star ingredients. Selecting an ingredient renders `<IngredientResearch>` for it. Default to the first star ingredient.

Open question for the build: how "star ingredients" are determined for a product (a flag, the actives, a curated subset). The audit step must resolve this before building the toggle.

---

## 7. Explicitly out of scope (for this feature)

- No AI grading, tiering, or evidence summaries. That is a separate later layer that will read from `research_papers`.
- No claim-vs-evidence checking.
- No full-text ingestion. Abstracts and metadata only.

---

## 8. Open decisions

- Staleness window length (start at 30 days).
- Whether to prefer higher-tier study types in the top 5 or keep pure relevance order (start with pure relevance).
- Cross-platform: the data layer (`packages/core`) is platform-agnostic and mobile can reuse it later; this spec's UI targets the web app.
