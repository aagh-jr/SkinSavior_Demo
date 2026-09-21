# Services & tools used in skinsavior

Every external service, API, data source and major tool this project depends
on, grouped by role. Compiled from `.env.example` files, `package.json`
dependencies, the `scripts/` pipeline, and `AGENTS.md`. Keep it current when a
service is added or dropped.

Legend: **Active** = in use now · **Optional** = feature-gated, works without ·
**Planned** = referenced but not built · **Historical** = migrated away from.

---

## Core infrastructure — Active

| Service | Role | Where |
|---|---|---|
| **Supabase** | Postgres database, auth, storage. The backend. | `NEXT_PUBLIC_SUPABASE_URL`, `@supabase/supabase-js`, `@supabase/ssr` |
| **Vercel** | Hosting / deployment of the web app. | Next.js target (note: deploy currently broken — see AGENTS.md) |
| **GitHub** | Source hosting + PRs. Repos: `skinsavior/skin_savior` (`origin`, main) and `aagh-jr/SkinSavior_Demo` (`demo`, demo mirror). | git remotes |

## AI / LLM — Active

| Service | Role | Key / package |
|---|---|---|
| **Anthropic (Claude)** | AI pipelines: product URL ingest, routine compatibility, skin-log summaries. Explains deterministic decisions only — never alters a score. | `ANTHROPIC_API_KEY`, `@anthropic-ai/sdk` |
| **Google Gemini** | Evidence-explainer surface. | `GEMINI_API_KEY`, `@google/genai` |

## Supporting services

| Service | Role | Status |
|---|---|---|
| **Upstash (Redis)** | Rate-limiting the paid AI endpoints. Fails **closed** (503) when unset. | Active for those endpoints · `@upstash/ratelimit` |
| **Firecrawl** | Last-resort scraper for JS-rendered / anti-bot storefronts (Target, Sephora). Plain fetch when unset. | Optional · `FIRECRAWL_API_KEY`, `firecrawl` |
| **NCBI / PubMed (E-utilities)** | Research pipeline — scientific evidence for ingredients. Contact email + optional API key raise the rate limit. | Active for research · `NCBI_CONTACT_EMAIL`, `NCBI_API_KEY` |

## Data sources (scraped / imported, not paid APIs)

| Source | Provides | Notes |
|---|---|---|
| **Brand Shopify storefronts** | Catalogs, studio photos, prices via `/products.json`. | Preferred source. Public + documented. |
| **INCIDecoder** | Ingredient lists (INCI) + official pack shots. | Throttles; see AGENTS.md gotchas. |
| **Open Beauty Facts** | Original seed data + crowd photos. | Being replaced. |
| **Olive Young** | — | Blocked entirely (bot protection + copyright). **Not usable.** |

## Build & developer tooling — Active

| Tool | Role |
|---|---|
| **Bun** (`bun@1.3.14`) | Package manager + runtime. |
| **Turborepo** | Monorepo build orchestration. |
| **Next.js 15** | Web app framework (`apps/web`). |
| **Expo** | Mobile app framework (`apps/mobile`). |
| **TypeScript** | Language. |
| **Tailwind CSS** | Styling. |
| **Radix UI** + **shadcn/ui** | UI component primitives. |
| **TanStack React Query** | Client data fetching. |
| **Zod** | Schema validation. |
| **Vitest** + **Playwright** | Testing. |
| **ESLint / Prettier** | Linting / formatting. |
| **Python** (`requests`, `urllib3`) | Offline data-import scripts in `scripts/`. |

## Design & Storybook

| Tool | Role |
|---|---|
| **Storybook 10** | Component gallery / design workshop for `apps/web`. |
| **MSW** (Mock Service Worker) | Blocks network calls inside Storybook. |
| **Chromatic** | Storybook visual-testing addon (`@chromatic-com/storybook`). |
| **Figma** | Design tool the token exports target. |
| **Tokens Studio** (Figma plugin) | Imports design tokens into Figma (`exports/skinsavior.tokens-studio.json`). |

## Historical / Planned

| Service | Status |
|---|---|
| **Lovable (Lovable Cloud)** | **Historical.** Project originated as "clear-beauty-ai" on Lovable; migrated off it to native Supabase auth (old `VITE_SUPABASE_*` vars replaced). |
| **PostHog** | **Planned.** Analytics — referenced in AGENTS.md, not built. Would live in `apps/web/src/lib/analytics.ts`. |
| **Rakuten / CJ / Impact** | **Planned.** Affiliate price feeds — open work, not integrated. |
| **EAN / barcode retailer sites** (dm, Rossmann, Carrefour, Lidl) | **Planned.** Untapped pack-shot source for supermarket own-label brands; licensing unchecked. |
