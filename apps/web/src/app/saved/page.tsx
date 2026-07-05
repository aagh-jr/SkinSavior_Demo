"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ProductThumb } from "@/components/ProductThumb";
import { products } from "@/lib/products";

const DEMO_SLUGS = products.map((p) => p.slug);

export default function SavedPage() {
  const [saved, setSaved] = useState<string[]>(DEMO_SLUGS);

  const savedProducts = products.filter((p) => saved.includes(p.slug));
  const remove = (slug: string) =>
    setSaved((s) => s.filter((x) => x !== slug));

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[1080px] px-12 py-11">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[34px] font-medium tracking-tight text-ink">
              Saved products
            </h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {saved.length} products you&apos;re keeping an eye on
            </p>
          </div>
          {saved.length > 0 ? (
            <button
              type="button"
              onClick={() => setSaved([])}
              className="text-[13px] text-muted-foreground underline underline-offset-[3px]"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {saved.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
            {savedProducts.map((p) => (
              <div
                key={p.slug}
                className="relative overflow-hidden rounded-[16px] border border-border bg-white"
              >
                <button
                  type="button"
                  title="Remove"
                  onClick={() => remove(p.slug)}
                  className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[15px] text-clay shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                >
                  ♥
                </button>
                <Link href={`/product/${p.slug}`}>
                  <ProductThumb
                    category={p.category}
                    name={p.name}
                    className="aspect-[4/3] w-full"
                    iconSize={48}
                  />
                  <div className="flex flex-col gap-1.5 p-3.5">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-clay">
                      {p.brand} · {p.category}
                    </div>
                    <div className="font-serif text-[17px] leading-tight text-ink">
                      {p.name}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-ink">
                        {p.price}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#d8ccba] bg-warm-white px-6 py-16 text-center">
            <div className="mx-auto mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#f3eadf] text-[26px] text-accent">
              ♡
            </div>
            <h2 className="font-serif text-[24px] font-medium text-ink">
              No saved products yet
            </h2>
            <p className="mx-auto my-2.5 max-w-md text-[14px] leading-relaxed text-muted-foreground">
              Tap the heart on any product and it&apos;ll show up here for quick
              access.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link
                href="/search"
                className="rounded-[10px] bg-primary px-5 py-3 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Browse products →
              </Link>
              <button
                type="button"
                onClick={() => setSaved(DEMO_SLUGS)}
                className="rounded-[10px] border border-accent px-5 py-3 text-[14px] font-semibold text-clay transition-colors hover:bg-[#fff7ea]"
              >
                Restore demo saves
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
