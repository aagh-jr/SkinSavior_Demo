"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchIngredientsPage } from "@/app/ingredients/actions";
import type { IngredientPage, IngredientRow } from "@/lib/ingredients-db";

function titleCase(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Prefer a common name, fall back to the (tidied) INCI name. */
function displayName(row: IngredientRow): string {
  return titleCase(row.common_name?.trim() || row.inci_name);
}

function IngredientCard({ row }: { row: IngredientRow }) {
  const name = displayName(row);
  const inci = titleCase(row.inci_name);
  const blurb = row.description?.trim() || row.safety_notes?.trim() || "";

  return (
    <Link
      href={`/ingredients/${row.id}`}
      className="block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
    >
      <h2 className="font-serif text-xl font-semibold text-ink">{name}</h2>
      {inci !== name && (
        <div className="mt-1 text-[12px] text-muted-foreground">{inci}</div>
      )}
      {blurb && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
      )}
    </Link>
  );
}

export function IngredientsExplorer({
  initialPage,
  initialQ,
}: {
  initialPage: IngredientPage;
  initialQ: string;
}) {
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [rows, setRows] = useState<IngredientRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // Guards against out-of-order responses: only the latest request wins.
  const reqId = useRef(0);
  const firstRender = useRef(true);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Refetch the first page whenever the filter or (debounced) search changes.
  // Skip the initial render — the server already provided that page.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetchIngredientsPage({ q: debouncedQ, offset: 0 }).then((page) => {
      if (id !== reqId.current) return; // superseded
      setRows(page.rows);
      setTotal(page.total);
      setHasMore(page.hasMore);
    }).catch(() => {
      if (id === reqId.current) { setError("Search is unavailable. Please retry."); setRows([]); setHasMore(false); }
    }).finally(() => {
      if (id === reqId.current) setLoading(false);
    });
  }, [debouncedQ, retry]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const id = reqId.current;
    setError(null);
    try {
    const page = await fetchIngredientsPage({
      q: debouncedQ,
      offset: rows.length,
    });
    if (id === reqId.current) {
      setRows((prev) => [...prev, ...page.rows]);
      setTotal(page.total);
      setHasMore(page.hasMore);
    }
    } catch {
      if (id === reqId.current) setError("Could not load more results. Please retry.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      {error && <div role="alert" className="my-4 rounded-xl border border-border p-4">{error} <button className="underline" onClick={() => setRetry((n) => n + 1)}>Retry search</button></div>}
      {/* Search */}
      <div className="mt-8">
        <input
          aria-label="Search ingredients"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ingredients by name…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {/* Result count */}
      <p className="mt-6 text-[13px] text-muted-foreground">
        {loading
          ? "Loading…"
          : `${total.toLocaleString()} ${total === 1 ? "ingredient" : "ingredients"}${
              debouncedQ.trim() ? " match your filter" : ""
            }`}
      </p>

      {/* Grid */}
      {rows.length === 0 && !loading && !error ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
          No ingredients match this filter.
        </div>
      ) : (
        <div
          className={`mt-6 grid gap-4 sm:grid-cols-2 transition-opacity ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {rows.map((row) => (
            <IngredientCard key={row.id} row={row} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && rows.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-primary/40 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : `Load more (${rows.length} of ${total.toLocaleString()})`}
          </button>
        </div>
      )}
    </div>
  );
}
