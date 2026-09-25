"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductThumb } from "@/components/ProductThumb";
import { useSearch, type SearchMode } from "@/hooks/useSearch";

export function SearchBar({
  initialQuery = "",
  initialMode = "products",
}: {
  initialQuery?: string;
  initialMode?: SearchMode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(initialQuery);
  // Fixed to the mode it was opened in (products by default). The in-bar
  // products/ingredients toggle was removed; ingredient search lives on the
  // /ingredients page.
  const [mode] = useState<SearchMode>(initialMode);
  const { dbHits, ingredientResults, status, retry } = useSearch(q, mode);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const productResults = dbHits.slice(0, 5);

  const hasResults =
    mode === "products" ? productResults.length > 0 : ingredientResults.length > 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const expanded = open || q.length > 0;

  const submit = () => {
    if (!q.trim()) return;
    const path = mode === "products" ? "/search" : "/ingredients";
    router.push(`${path}?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="flex items-center">
      <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-full border border-soft-tan bg-white px-3.5 py-2 transition-all"
        style={{ width: expanded ? 420 : 330 }}
      >
        <span className="text-sm text-faint">⌕</span>
        <input
          aria-label={mode === "products" ? "Search products" : "Search ingredients"}
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={mode === "products" ? "Search products" : "Search ingredients"}
          className="w-full bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="text-xs text-faint hover:text-link"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </form>

      {open && q.trim() && (
        <div className="absolute right-0 mt-2 w-[380px] overflow-hidden rounded-xl border border-soft-tan bg-white shadow-lg z-30">
          {status !== "idle" ? (
            <div role="status" className="px-4 py-5 text-sm">{status === "loading" ? "Searching…" : <><span>Search unavailable. </span><button onClick={retry} className="underline">Retry</button></>}</div>
          ) : !hasResults ? (
            <div className="px-4 py-5 text-sm text-faint">
              No {mode} matching <strong>&quot;{q}&quot;</strong>
            </div>
          ) : mode === "products" ? (
            <>
              {productResults.map((p) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-soft-tan px-4 py-3 last:border-0 hover:bg-secondary"
                >
                  <ProductThumb
                    category={p.category}
                    imageUrl={p.imageUrl}
                    name={p.name}
                    className="h-11 w-11 flex-shrink-0 rounded-lg"
                    iconSize={22}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">
                      {p.name}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-link">
                      {p.brand} · {p.category}
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                onClick={() => setOpen(false)}
                className="block bg-secondary px-4 py-2.5 text-center text-xs font-semibold text-link hover:opacity-80"
              >
                See all results for &quot;{q}&quot; →
              </Link>
            </>
          ) : (
            <>
              {ingredientResults.map((ing) => (
                <Link
                  key={ing.id}
                  href={`/ingredients/${ing.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-soft-tan px-4 py-3 last:border-0 hover:bg-secondary"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-soft-tan bg-secondary font-serif text-sm font-semibold text-link">
                    INCI
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">
                      {ing.name}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-link">
                      Ingredient profile
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href={`/ingredients?q=${encodeURIComponent(q)}`}
                onClick={() => setOpen(false)}
                className="block bg-secondary px-4 py-2.5 text-center text-xs font-semibold text-link hover:opacity-80"
              >
                See all ingredients for &quot;{q}&quot; →
              </Link>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
