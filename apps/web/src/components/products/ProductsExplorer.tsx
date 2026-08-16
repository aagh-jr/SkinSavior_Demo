"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductThumb } from "@/components/ProductThumb";
import { fetchProductsPage } from "@/app/search/actions";
import type {
  ProductCardRow,
  ProductCategory,
  ProductsPage,
} from "@/lib/products-db";

/** Client-safe tidy of a raw category value for the card subtitle. */
function prettyCategory(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function ProductCard({ p }: { p: ProductCardRow }) {
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-square">
        <ProductThumb
          category={p.category}
          imageUrl={p.image_url}
          name={p.name}
          className="absolute inset-0 h-full w-full"
          iconSize={56}
        />
      </div>
      <div className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          {p.brand}
          {p.origin ? ` · ${p.origin}` : ""}
        </div>
        <div className="mt-1.5 font-serif text-xl font-medium leading-tight text-ink">
          {p.name}
        </div>
        {p.category && (
          <div className="mt-1 text-sm text-muted-foreground">
            {prettyCategory(p.category)}
          </div>
        )}
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-serif text-lg font-semibold text-ink">
            {p.price ?? ""}
          </span>
          <span className="text-sm font-semibold text-primary group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [rows, setRows] = useState<ProductCardRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const reqId = useRef(0);
  const firstRender = useRef(true);

  const activeCategory =
    activeKey === null ? null : categories.find((c) => c.key === activeKey) ?? null;
  const rawCategories = activeCategory?.rawValues ?? null;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Refetch the first page when the filter or (debounced) search changes.
  // Skip the initial render — the server already provided that page.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    fetchProductsPage({ q: debouncedQ, rawCategories, offset: 0 }).then((page) => {
      if (id !== reqId.current) return; // superseded
      setRows(page.rows);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setLoading(false);
    });
    // rawCategories is derived from activeKey; depend on the key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, debouncedQ]);

  async function loadMore() {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    const id = reqId.current;
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
          placeholder="Search products by name, brand, or ingredient…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {/* Filter — collapsed behind a control rather than a permanent wall of
          chips. Retail catalogues lead with product, not taxonomy: the shelf
          should be the first thing you see, with narrowing available when you
          want it. The active filter stays visible as a removable pill so a
          narrowed list is never mistaken for the whole catalogue. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          aria-expanded={filterOpen}
          className={
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors " +
            (filterOpen || activeKey
              ? "border-primary text-ink"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-ink")
          }
        >
          <span aria-hidden>⌄</span>
          Filter by type
        </button>

        {activeCategory && (
          <button
            type="button"
            onClick={() => setActiveKey(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground"
            aria-label={`Remove ${activeCategory.label} filter`}
          >
            {activeCategory.label}
            <span aria-hidden>×</span>
          </button>
        )}
      </div>

      {filterOpen && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-border bg-warm-white p-4">
          <FilterChip
            active={activeKey === null}
            onClick={() => {
              setActiveKey(null);
              setFilterOpen(false);
            }}
            label="All types"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.key}
              active={activeKey === c.key}
              onClick={() => {
                setActiveKey(c.key);
                setFilterOpen(false);
              }}
              label={`${c.label} (${c.count})`}
            />
          ))}
        </div>
      )}

      {/* Result count */}
      <p className="mt-6 text-[13px] text-muted-foreground">
        {loading
          ? "Loading…"
          : `${total.toLocaleString()} ${total === 1 ? "product" : "products"}${
              activeKey || debouncedQ.trim() ? " match your filter" : ""
            }`}
      </p>

      {/* Grid */}
      {rows.length === 0 && !loading ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
          No products match this filter.
        </div>
      ) : (
        <div
          className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {rows.map((p) => (
            <ProductCard key={p.slug} p={p} />
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
            {loadingMore
              ? "Loading…"
              : `Load more (${rows.length} of ${total.toLocaleString()})`}
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
