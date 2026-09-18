/** A failed page must never be mistaken for a complete ingredient list. */
export async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error || !data) throw new Error("Data unavailable: the complete catalogue could not be loaded.");
    rows.push(...(data as T[]));
    if (data.length < size) return rows;
  }
}

/** Remove PostgREST filter syntax and SQL pattern wildcards from user text. */
export function sanitizeSearch(value: string): string {
  return value.replace(/[%,()_"\\]/g, " ").trim();
}
