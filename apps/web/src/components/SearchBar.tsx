"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/products";
import { searchIngredients } from "@/lib/ingredients";

interface DbHit {
  slug: string;
  name: string;
  brand: string;
  category: string;
}

type Mode = "products" | "ingredients";

export function SearchBar({
  initialQuery = "",
  initialMode = "products",
}: {
  initialQuery?: string;
  initialMode?: Mode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(initialQuery);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [dbHits, setDbHits] = useState<DbHit[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Product results: static demo matches first, live catalog after; dedupe by
  // slug, cap at 5.
  const staticResults = searchProducts(q);
  const staticSlugs = new Set(staticResults.map((p) => p.slug));
  const productResults = [
    ...staticResults.map((p) => ({ ...p, isDb: false })),
    ...dbHits
      .filter((h) => !staticSlugs.has(h.slug))
      .map((h) => ({ ...h, match: 0, isDb: true })),
  ].slice(0, 5);

  const ingredientResults =
    mode === "ingredients" ? searchIngredients(q).slice(0, 5) : [];

  const hasResults =
    mode === "products" ? productResults.length > 0 : ingredientResults.length > 0;

  // Debounced live-catalog search (products mode only — ingredients are local).
  useEffect(() => {
    if (mode !== "products") {
      setDbHits([]);
      return;
    }
    const needle = q.trim();
    if (!needle) {
      setDbHits([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(needle)}`, {
          signal: controller.signal,
        });
        if (res.ok) setDbHits((await res.json()).results ?? []);
      } catch {
        // aborted or offline — keep whatever we had
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, mode]);

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
    <div ref={wrapRef} className="flex items-center gap-2">
      {/* Products / Ingredients toggle */}
      <div className="flex flex-shrink-0 items-center rounded-full border border-[#e6ddcf] bg-white p-0.5 text-[11px] font-semibold">
        {(["products", "ingredients"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setOpen(true);
              inputRef.current?.focus();
            }}
            className={
              "rounded-full px-2.5 py-1 capitalize transition-colors " +
              (mode === m
                ? "bg-[#9a4a2f] text-white"
                : "text-[#9a4a2f] hover:bg-[#fbf3ec]")
            }
          >
            {m}
          </button>
        ))}
      </div>

      <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-full border border-[#e6ddcf] bg-white px-3.5 py-2 transition-all"
        style={{ width: expanded ? 300 : 220 }}
      >
        <span className="text-sm text-[#b3a690]">⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={mode === "products" ? "Search products" : "Search ingredients"}
          className="w-full bg-transparent text-[13px] text-[#2a241d] placeholder:text-[#b3a690] focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            className="text-xs text-[#b3a690] hover:text-[#9a4a2f]"
            aria-label="Clear"
          >
            ✕
          </button>
        )}
      </form>

      {open && q.trim() && (
        <div className="absolute right-0 mt-2 w-[380px] overflow-hidden rounded-xl border border-[#e6ddcf] bg-white shadow-lg z-30">
          {!hasResults ? (
            <div className="px-4 py-5 text-sm text-[#6b5f4f]">
              No {mode} matching <strong>&quot;{q}&quot;</strong>
            </div>
          ) : mode === "products" ? (
            <>
              {productResults.map((p) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-[#f0e8db] px-4 py-3 last:border-0 hover:bg-[#fbf3ec]"
                >
                  <div
                    className="h-11 w-11 flex-shrink-0 rounded-lg"
                    style={{
                      background:
                        "repeating-linear-gradient(45deg,#e7ddcc 0 8px,#efe7d9 8px 16px)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-[#1d1812]">
                      {p.name}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#9a4a2f]">
                      {p.brand} · {p.category}
                    </div>
                  </div>
                  {p.match > 0 && (
                    <div className="text-xs font-semibold text-[#9a4a2f]">{p.match}%</div>
                  )}
                </Link>
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                onClick={() => setOpen(false)}
                className="block bg-[#fbf3ec] px-4 py-2.5 text-center text-xs font-semibold text-[#9a4a2f] hover:bg-[#f6ece2]"
              >
                See all results for &quot;{q}&quot; →
              </Link>
            </>
          ) : (
            <>
              {ingredientResults.map((ing) => (
                <Link
                  key={ing.slug}
                  href={`/ingredients?q=${encodeURIComponent(ing.name)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-[#f0e8db] px-4 py-3 last:border-0 hover:bg-[#fbf3ec]"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-[#e6ddcf] bg-[#fbf3ec] font-serif text-sm font-semibold text-[#9a4a2f]">
                    {ing.grade}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-[#1d1812]">
                      {ing.name}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-[#9a4a2f]">
                      {ing.tag}
                    </div>
                  </div>
                </Link>
              ))}
              <Link
                href={`/ingredients?q=${encodeURIComponent(q)}`}
                onClick={() => setOpen(false)}
                className="block bg-[#fbf3ec] px-4 py-2.5 text-center text-xs font-semibold text-[#9a4a2f] hover:bg-[#f6ece2]"
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
