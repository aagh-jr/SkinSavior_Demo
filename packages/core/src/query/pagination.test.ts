import { describe, expect, it } from "vitest";
import { fetchAllPages, sanitizeSearch } from "./pagination";

describe("complete catalogue reads", () => {
  it("includes the tail beyond the PostgREST cap", async () => {
    const source = [...Array.from({ length: 1000 }, () => "water"), "retinol"];
    const result = await fetchAllPages<string>(async (from, to) => ({ data: source.slice(from, to + 1), error: null }));
    expect(result).toEqual(source);
  });
  it.each([0, 1000])("rejects failure at offset %i rather than returning partial data", async (failedAt) => {
    await expect(fetchAllPages(async (from) => from === failedAt
      ? { data: null, error: new Error("offline") }
      : { data: Array(1000).fill("water"), error: null })).rejects.toThrow("complete catalogue");
  });
  it("distinguishes empty results from missing data", async () => {
    await expect(fetchAllPages(async () => ({ data: [], error: null }))).resolves.toEqual([]);
    await expect(fetchAllPages(async () => ({ data: null, error: null }))).rejects.toThrow();
  });
  it("removes filter syntax and wildcards", () => {
    expect(sanitizeSearch('%,()_"\\')).toBe("");
    expect(sanitizeSearch("  ceramide  ")).toBe("ceramide");
  });
});
