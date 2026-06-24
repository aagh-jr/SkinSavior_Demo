"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchProducts } from "@/lib/products";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(initialQuery);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = searchProducts(q).slice(0, 5);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const expanded = open || q.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) {
            router.push(`/search?q=${encodeURIComponent(q)}`);
            setOpen(false);
          }
        }}
        className="flex items-center gap-2 rounded-full border border-[#e6ddcf] bg-white px-3.5 py-2 transition-all"
        style={{ width: expanded ? 340 : 240 }}
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
          placeholder="Search products & ingredients"
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
          {results.length === 0 ? (
            <div className="px-4 py-5 text-sm text-[#6b5f4f]">
              No matches for <strong>&quot;{q}&quot;</strong>
            </div>
          ) : (
            <>
              {results.map((p) => (
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
                  <div className="text-xs font-semibold text-[#9a4a2f]">{p.match}%</div>
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
          )}
        </div>
      )}
    </div>
  );
}
