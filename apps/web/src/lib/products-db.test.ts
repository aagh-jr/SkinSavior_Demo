import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ queries: [] as { table: string; calls: [string, unknown[]][] }[], results: [] as unknown[] }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: {
  from(table: string) {
    const query = { table, calls: [] as [string, unknown[]][] };
    state.queries.push(query);
    const result = state.results.shift() ?? { data: [], error: null };
    const builder: any = new Proxy({}, { get(_target, name: string) {
      if (name === "then") return Promise.resolve(result).then.bind(Promise.resolve(result));
      return (...args: unknown[]) => { query.calls.push([name, args]); return builder; };
    } });
    return builder;
  },
} }));
vi.mock("@/lib/brands-db", () => ({ canonicalBrand: (s: string) => s, normalizeCategory: (s: string) => ({ key: s, label: s }) }));
vi.mock("@/lib/ingest", () => ({ slugify: (s: string) => s }));
vi.mock("@skinsavior/core/research", () => ({ isResearched: () => false }));

import { getDbProduct, listProductCategories, listRelatedDbProducts, searchDbProductRows } from "./products-db";

beforeEach(() => { state.queries = []; state.results = []; });

describe("visible catalogue queries", () => {
  it("excludes hidden products from direct lookup and related products", async () => {
    state.results = [{ data: null, error: null }, { data: [], error: null }];
    expect(await getDbProduct("hidden-mascara")).toBeNull();
    await listRelatedDbProducts("serum", "Serums");
    for (const query of state.queries) expect(query.calls).toContainEqual(["is", ["excluded_reason", null]]);
    expect(state.queries[1].calls).toContainEqual(["neq", ["slug", "serum"]]);
  });
  it("filters both text and ingredient product hits", async () => {
    state.results = [{ data: [], error: null }, { data: [{ id: "ing" }], error: null }, { data: [{ product_id: "p" }], error: null }, { data: [], error: null }];
    await searchDbProductRows("retinol");
    const products = state.queries.filter((q) => q.table === "products");
    expect(products).toHaveLength(2);
    for (const query of products) expect(query.calls).toContainEqual(["is", ["excluded_reason", null]]);
  });
  it("counts categories past 1000 rows and filters every page", async () => {
    state.results = [{ data: Array(1000).fill({ category: "Serums" }), error: null }, { data: [{ category: "Sunscreens" }], error: null }];
    expect(await listProductCategories()).toEqual([
      { key: "Serums", label: "Serums", rawValues: ["Serums"], count: 1000 },
      { key: "Sunscreens", label: "Sunscreens", rawValues: ["Sunscreens"], count: 1 },
    ]);
    for (const query of state.queries) expect(query.calls).toContainEqual(["is", ["excluded_reason", null]]);
    expect(state.queries[1].calls).toContainEqual(["range", [1000, 1999]]);
  });
  it("does not turn a database outage into a missing product", async () => {
    state.results = [{ data: null, error: { message: "offline" } }];
    await expect(getDbProduct("serum")).rejects.toThrow();
  });
});
