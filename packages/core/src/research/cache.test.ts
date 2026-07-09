import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientResearch, STALENESS_MS } from "./cache";
import type { Paper } from "./schema";

const NIACINAMIDE = "niacinamide"; // in the allowlist
const ID = "00000000-0000-0000-0000-000000000001";

function paper(pmid: string, rank: number): Paper {
  return {
    pmid,
    title: `Paper ${pmid}`,
    abstract: null,
    journal: "J Test",
    year: 2020,
    publication_types: ["Journal Article"],
    doi: null,
    pubmed_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    rank,
  };
}

/**
 * Minimal fake of the Supabase query builder covering just the calls the cache
 * layer makes: meta.select().eq().maybeSingle(), papers.select().eq().order(),
 * delete().eq(), and upsert().
 */
function fakeDb(opts: {
  meta?: { last_fetched_at: string; status: string } | null;
  cachedPapers?: Paper[];
}) {
  const writes: { table: string; op: string; rows?: unknown }[] = [];
  const cached = opts.cachedPapers ?? [];

  const db = {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({ data: opts.meta ?? null }),
                order: async () => ({ data: cached }),
              };
            },
          };
        },
        delete() {
          return {
            eq: async () => {
              writes.push({ table, op: "delete" });
              return { data: null };
            },
          };
        },
        upsert: async (rows: unknown) => {
          writes.push({ table, op: "upsert", rows });
          return { data: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  return { db, writes };
}

describe("getIngredientResearch", () => {
  it("skips non-allowlisted ingredients without touching PubMed", async () => {
    const { db } = fakeDb({});
    const fetchPapers = vi.fn();
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: "aqua",
      fetchPapers,
    });
    expect(res).toEqual({ papers: [], status: "empty", cached: true });
    expect(fetchPapers).not.toHaveBeenCalled();
  });

  it("returns fresh cache without calling PubMed", async () => {
    const now = Date.now();
    const { db } = fakeDb({
      meta: { last_fetched_at: new Date(now - 1000).toISOString(), status: "ok" },
      cachedPapers: [paper("111", 1), paper("222", 2)],
    });
    const fetchPapers = vi.fn();
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: NIACINAMIDE,
      now,
      fetchPapers,
    });
    expect(res.cached).toBe(true);
    expect(res.status).toBe("ok");
    expect(res.papers).toHaveLength(2);
    expect(fetchPapers).not.toHaveBeenCalled();
  });

  it("fetches live when meta is stale and writes papers + meta", async () => {
    const now = Date.now();
    const { db, writes } = fakeDb({
      meta: { last_fetched_at: new Date(now - STALENESS_MS - 1).toISOString(), status: "ok" },
    });
    const fetchPapers = vi.fn(async () => [paper("999", 1)]);
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: NIACINAMIDE,
      now,
      fetchPapers,
    });
    expect(fetchPapers).toHaveBeenCalledOnce();
    expect(res.cached).toBe(false);
    expect(res.status).toBe("ok");
    expect(writes.some((w) => w.table === "research_papers" && w.op === "upsert")).toBe(true);
    expect(writes.some((w) => w.table === "ingredient_research_meta")).toBe(true);
  });

  it("caches the empty case as status 'empty'", async () => {
    const { db } = fakeDb({ meta: null });
    const fetchPapers = vi.fn(async () => []);
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: NIACINAMIDE,
      fetchPapers,
    });
    expect(res.status).toBe("empty");
    expect(res.papers).toHaveLength(0);
  });

  it("falls back to stale cache when PubMed errors", async () => {
    const { db } = fakeDb({
      meta: null,
      cachedPapers: [paper("111", 1)],
    });
    const fetchPapers = vi.fn(async () => {
      throw new Error("network");
    });
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: NIACINAMIDE,
      fetchPapers,
    });
    expect(res.status).toBe("ok");
    expect(res.papers).toHaveLength(1);
    expect(res.cached).toBe(true);
  });

  it("returns status 'error' when PubMed fails and nothing is cached", async () => {
    const { db } = fakeDb({ meta: null, cachedPapers: [] });
    const fetchPapers = vi.fn(async () => {
      throw new Error("network");
    });
    const res = await getIngredientResearch({
      db,
      ingredientId: ID,
      inciName: NIACINAMIDE,
      fetchPapers,
    });
    expect(res.status).toBe("error");
    expect(res.papers).toHaveLength(0);
  });
});
