"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchProductsPage } from "@/app/search/actions";
import type {
  ProductCardRow,
  ProductCategory,
  ProductsPage,
} from "@skinsavior/core/types";
import { GridCard } from "@/components/products/GridCard";
import { ListCard } from "@/components/products/ListCard";
import { RailRow } from "@/components/products/RailRow";
import { ViewButton } from "@/components/products/ViewButton";

type View = "grid" | "list";

export function ProductsExplorer({
  categories,
  initialPage,
  initialQ,
}: {
  categories: ProductCategory[];
  initialPage: ProductsPage;
  initialQ: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [rows, setRows] = useState<ProductCardRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [view, setView] = useState<View>("grid");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const reqId = useRef(0);
  const firstRender = useRef(true);

  const activeCategory =
    activeKey === null ? null : categories.find((c) => c.key === activeKey) ?? null;
  const rawCategories = activeCategory?.rawValues ?? null;
  const hasFilter = Boolean(activeKey || debouncedQ.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetchProductsPage({ q: debouncedQ, rawCategories, offset: 0 }).then((page) => {
      if (id !== reqId.current) return;
      setRows(page.rows);
      setTotal(page.total);
      setHasMore(page.hasMore);
    }).catch(() => {
      if (id === reqId.current) { setError("Search is unavailable. Please retry."); setRows([]); setHasMore(false); }
    }).finally(() => {
      if (id === reqId.current) setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, debouncedQ, retry]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const id = reqId.current;
    setError(null);
    try {
    const page = await fetchProductsPage({
      q: debouncedQ,
      rawCategories,
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
      {/* Header */}
      <div>
        <h1 className="m-0 font-serif text-4xl font-medium tracking-tight text-ink">
          Search
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {loading
            ? "Searching…"
            : `${total.toLocaleString()} ${total === 1 ? "product" : "products"}${
                debouncedQ.trim() ? ` match “${debouncedQ.trim()}”` : ""
              }`}
        </p>
      </div>

      {/* Search box */}
      <div className="mt-6">
        <input
          aria-label="Search products"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products by name, brand, or ingredient…"
          className="w-full rounded-full border border-soft-tan bg-white px-5 py-3 text-sm text-ink outline-none placeholder:text-faint focus:border-clay"
        />
      </div>

      {/* Rail + results */}
      <div className="mt-7 grid grid-cols-1 items-start gap-8 md:grid-cols-[240px_1fr]">
        {/* Filter rail */}
        <aside className="flex flex-col gap-2.5">
          <div className="font-serif text-[20px] font-medium text-ink">Filter</div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Type
          </div>
          <RailRow
            label="All types"
            active={activeKey === null}
            onClick={() => setActiveKey(null)}
          />
          {categories.map((c) => (
            <RailRow
              key={c.key}
              label={c.label}
              hint={`${c.count}`}
              active={activeKey === c.key}
              onClick={() => setActiveKey(c.key)}
            />
          ))}

          {hasFilter && (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveKey(null)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-link"
                  >
                    {activeCategory.label} ×
                  </button>
                )}
                {debouncedQ.trim() && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[12px] font-medium text-link"
                  >
                    “{debouncedQ.trim()}” ×
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveKey(null);
                  setQ("");
                }}
                className="mt-1 self-start text-[12px] font-semibold text-link hover:underline"
              >
                Clear all
              </button>
            </>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="font-serif text-[20px] font-medium text-ink">
              Products
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/add"
                className="rounded-[10px] border border-soft-tan px-3.5 py-2 text-[13px] font-semibold text-link transition-colors hover:bg-secondary"
              >
                + Add product
              </Link>
              <div className="flex gap-0.5 rounded-[10px] border border-soft-tan bg-warm-white p-[3px]">
                <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </ViewButton>
                <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Grid view">
                  <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
                  <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
                  <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
                  <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
                </ViewButton>
              </div>
            </div>
          </div>
          {rows.length === 0 && !loading && !error ? (
            <div className="rounded-xl border border-dashed border-soft-tan bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
              No products match this filter.
            </div>
          ) : view === "grid" ? (
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
                loading ? "opacity-50" : "opacity-100"
              } transition-opacity`}
            >
              {rows.map((p) => (
                <GridCard key={p.slug} p={p} />
              ))}
            </div>
          ) : (
            <div
              className={`flex flex-col gap-3 ${
                loading ? "opacity-50" : "opacity-100"
              } transition-opacity`}
            >
              {rows.map((p) => (
                <ListCard key={p.slug} p={p} />
              ))}
            </div>
          )}

          {hasMore && rows.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-soft-tan bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-clay disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading…"
                  : `Load more (${rows.length} of ${total.toLocaleString()})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
