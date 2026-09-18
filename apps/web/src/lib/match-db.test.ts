import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ results: [] as unknown[] }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: { id: "viewer" } }, error: null }) },
  from() {
    const result = state.results.shift();
    const builder: any = new Proxy({}, { get(_target, name: string) {
      if (name === "then") return Promise.resolve(result).then.bind(Promise.resolve(result));
      return () => builder;
    } });
    return builder;
  },
}) }));
vi.mock("@/lib/routines-db", () => ({ getHomeRoutine: async () => null }));
import { getMyProfile, scoreProductsForMe } from "./match-db";

const profile = { data: { skin_type: "dry", pregnancy_status: "pregnant_or_breastfeeding" }, error: null };
const products = { data: [{ id: "p", slug: "serum", canonical_category: "serum" }], error: null };
const firstPage = { data: Array.from({ length: 1000 }, (_, position) => ({ product_id: "p", position, ingredients: { inci_name: "Water", functions: null } })), error: null };

beforeEach(() => { state.results = []; });

describe("safety read failures", () => {
  it("rejects a failed profile read instead of treating the viewer as having no safety fields", async () => {
    state.results = [{ data: null, error: { message: "offline" } }];
    await expect(getMyProfile()).rejects.toThrow("Safety data unavailable");
  });
  it("rejects a second-page failure instead of scoring the first page", async () => {
    state.results = [profile, products, firstPage, { data: null, error: { message: "offline" } }];
    await expect(scoreProductsForMe(["serum"])).rejects.toThrow("complete catalogue");
  });
  it("preserves a pregnancy block caused by an ingredient beyond the first page", async () => {
    state.results = [profile, products, firstPage, { data: [{ product_id: "p", position: 1000, ingredients: { inci_name: "Retinol", functions: null } }], error: null }];
    const result = await scoreProductsForMe(["serum"]);
    expect(result?.serum.blocked).toBe(true);
    expect(result?.serum.blockReasons.length).toBeGreaterThan(0);
  });
});
