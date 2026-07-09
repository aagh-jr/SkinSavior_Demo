import type { SupabaseClient } from "@supabase/supabase-js";
import type { Paper } from "./schema";
import { fetchPubMedPapers } from "./pubmed";
import { researchedFor } from "./allowlist";

/** Staleness window: research doesn't change hour to hour. Spec section 4. */
export const STALENESS_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type ResearchStatus = "ok" | "empty" | "error";

export interface IngredientResearch {
  papers: Paper[];
  status: ResearchStatus;
  /** True when served from cache without hitting PubMed. */
  cached: boolean;
}

interface CacheDeps {
  /** Service-role client — writes bypass RLS. */
  db: SupabaseClient;
  ingredientId: string;
  /** INCI name, used to resolve the PubMed search term from the allowlist. */
  inciName: string;
  /** Override for tests. */
  now?: number;
  fetchPapers?: (searchTerm: string) => Promise<Paper[]>;
}

/** Read cached papers for an ingredient, ordered by rank. */
async function readCached(db: SupabaseClient, ingredientId: string): Promise<Paper[]> {
  const { data } = await db
    .from("research_papers")
    .select("pmid, title, abstract, journal, year, publication_types, doi, pubmed_url, rank")
    .eq("ingredient_id", ingredientId)
    .order("rank", { ascending: true });
  return ((data ?? []) as Paper[]);
}

/**
 * Fetch-on-miss-then-cache research for one ingredient (spec section 4):
 *
 * 1. If meta is fresh (< 30 days), return cached rows.
 * 2. Else call PubMed, upsert the top 5, update meta, return.
 * 3. On PubMed error, fall back to cached rows; if none, return status "error".
 *
 * Returns empty with status "empty" for allowlisted ingredients that genuinely
 * have no results (cached so they don't refetch every load). Ingredients not in
 * the allowlist are never fetched — callers should gate on that before calling.
 */
export async function getIngredientResearch({
  db,
  ingredientId,
  inciName,
  now = Date.now(),
  fetchPapers = (term) => fetchPubMedPapers(term),
}: CacheDeps): Promise<IngredientResearch> {
  const entry = researchedFor(inciName);
  // Not in the pilot: nothing to fetch, nothing cached to serve.
  if (!entry) return { papers: [], status: "empty", cached: true };

  // 1. Freshness check.
  const { data: meta } = await db
    .from("ingredient_research_meta")
    .select("last_fetched_at, status")
    .eq("ingredient_id", ingredientId)
    .maybeSingle<{ last_fetched_at: string; status: ResearchStatus }>();

  if (meta) {
    const age = now - new Date(meta.last_fetched_at).getTime();
    if (age < STALENESS_MS) {
      const papers = await readCached(db, ingredientId);
      const status: ResearchStatus = papers.length ? "ok" : meta.status === "error" ? "error" : "empty";
      return { papers, status, cached: true };
    }
  }

  // 2. Stale or missing — fetch live.
  let papers: Paper[];
  try {
    papers = await fetchPapers(entry.searchTerm);
  } catch {
    // 3. PubMed failed — serve stale cache if we have any, else flag error.
    const cached = await readCached(db, ingredientId);
    if (cached.length) return { papers: cached, status: "ok", cached: true };
    await upsertMeta(db, ingredientId, 0, "error", now);
    return { papers: [], status: "error", cached: false };
  }

  await writePapers(db, ingredientId, papers, now);
  await upsertMeta(db, ingredientId, papers.length, papers.length ? "ok" : "empty", now);
  return { papers, status: papers.length ? "ok" : "empty", cached: false };
}

/** Replace the cached paper set for an ingredient with a fresh top-5. */
async function writePapers(
  db: SupabaseClient,
  ingredientId: string,
  papers: Paper[],
  now: number,
): Promise<void> {
  // Clear stale rows first so a shrinking result set (e.g. 5 -> 3) doesn't leave
  // orphans, then upsert on the (ingredient_id, pmid) unique constraint.
  await db.from("research_papers").delete().eq("ingredient_id", ingredientId);
  if (!papers.length) return;
  const fetchedAt = new Date(now).toISOString();
  await db.from("research_papers").upsert(
    papers.map((p) => ({
      ingredient_id: ingredientId,
      pmid: p.pmid,
      title: p.title,
      abstract: p.abstract,
      journal: p.journal,
      year: p.year,
      publication_types: p.publication_types,
      doi: p.doi,
      pubmed_url: p.pubmed_url,
      rank: p.rank,
      fetched_at: fetchedAt,
    })),
    { onConflict: "ingredient_id,pmid" },
  );
}

async function upsertMeta(
  db: SupabaseClient,
  ingredientId: string,
  paperCount: number,
  status: ResearchStatus,
  now: number,
): Promise<void> {
  await db.from("ingredient_research_meta").upsert(
    {
      ingredient_id: ingredientId,
      last_fetched_at: new Date(now).toISOString(),
      paper_count: paperCount,
      status,
    },
    { onConflict: "ingredient_id" },
  );
}
