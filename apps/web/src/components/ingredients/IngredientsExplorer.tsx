"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchIngredientsPage } from "@/app/ingredients/actions";
import { INGREDIENT_FILTERS } from "@/lib/ingredient-filters";
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
  const tags = (row.functions ?? []).slice(0, 4);
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
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {titleCase(t)}
            </span>
          ))}
        </div>
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
  const [filter, setFilter] = useState<string | null>(null);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [rows, setRows] = useState<IngredientRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
    fetchIngredientsPage({ filter, q: debouncedQ, offset: 0 }).then((page) => {
      if (id !== reqId.current) return; // superseded
      setRows(page.rows);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setLoading(false);
    });
  }, [filter, debouncedQ]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const id = reqId.current;
    const page = await fetchIngredientsPage({
      filter,
      q: debouncedQ,
      offset: rows.length,
    });
    if (id === reqId.current) {
      setRows((prev) => [...prev, ...page.rows]);
      setTotal(page.total);
      setHasMore(page.hasMore);
    }
    setLoadingMore(false);
  }

  return (
    <div>
      {/* Search */}
      <div className="mt-8">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ingredients by name…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === null}
          onClick={() => setFilter(null)}
          label="All"
        />
        {INGREDIENT_FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
            label={f.label}
          />
        ))}
      </div>

      {/* Result count */}
      <p className="mt-6 text-[13px] text-muted-foreground">
        {loading
          ? "Loading…"
          : `${total.toLocaleString()} ${total === 1 ? "ingredient" : "ingredients"}${
              filter || debouncedQ.trim() ? " match your filter" : ""
            }`}
      </p>

      {/* Grid */}
      {rows.length === 0 && !loading ? (
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

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
