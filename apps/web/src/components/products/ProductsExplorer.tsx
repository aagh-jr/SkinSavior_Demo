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

type View = "grid" | "list";

/** Client-safe tidy of a raw category value for the card subtitle. */
function prettyCategory(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function GridCard({ p }: { p: ProductCardRow }) {
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group overflow-hidden rounded-xl border border-soft-tan bg-white transition-colors hover:border-clay hover:bg-secondary/40"
    >
      <div className="relative aspect-[4/3]">
        <ProductThumb
          category={p.category}
          imageUrl={p.image_url}
          name={p.name}
          className="absolute inset-0 h-full w-full"
          imageClassName="object-contain"
          iconSize={48}
        />
      </div>
      <div className="relative -mt-3 rounded-t-xl bg-white px-4 pb-4 pt-3.5 transition-colors group-hover:bg-secondary/40">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-link">
          {p.brand}
        </div>
        <div className="mt-1 font-serif text-[17px] font-medium leading-[1.18] text-ink">
          {p.name}
        </div>
        {p.category && (
          <div className="mt-1 text-[13px] text-muted-foreground">
            {prettyCategory(p.category)}
          </div>
        )}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-serif text-[16px] font-semibold text-ink">
            {p.price ?? ""}
          </span>
          <span className="text-[13px] font-semibold text-link group-hover:underline">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ p }: { p: ProductCardRow }) {
  return (
    <Link
      href={`/product/${p.slug}`}
      className="flex items-center gap-4 rounded-xl border border-soft-tan bg-white p-3 transition-colors hover:border-clay hover:bg-secondary/40"
    >
      <div className="h-[64px] w-[64px] flex-shrink-0 overflow-hidden rounded-xl border border-soft-tan">
        <ProductThumb
          category={p.category}
          imageUrl={p.image_url}
          name={p.name}
          className="h-full w-full"
          iconSize={28}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-link">
          {p.brand}
        </div>
        <div className="mt-0.5 truncate font-serif text-[16px] font-medium text-ink">
          {p.name}
        </div>
        {p.category && (
          <div className="text-[12px] text-muted-foreground">
            {prettyCategory(p.category)}
          </div>
        )}
      </div>
      <span className="flex-shrink-0 font-serif text-[15px] font-semibold text-ink">
        {p.price ?? ""}
      </span>
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
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [rows, setRows] = useState<ProductCardRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [view, setView] = useState<View>("grid");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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
    fetchProductsPage({ q: debouncedQ, rawCategories, offset: 0 }).then((page) => {
      if (id !== reqId.current) return;
      setRows(page.rows);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setLoading(false);
    });
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
          {rows.length === 0 && !loading ? (
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

function RailRow({
  label,
  hint,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-between gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors " +
        (active
          ? "border-clay bg-secondary"
          : "border-soft-tan bg-warm-white hover:border-clay hover:bg-secondary/60")
      }
    >
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </button>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={
        "flex h-7 w-8 items-center justify-center rounded-[7px] transition-colors " +
        (active ? "bg-secondary text-link" : "text-faint hover:text-ink")
      }
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        {children}
      </svg>
    </button>
  );
}
