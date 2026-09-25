import Link from "next/link";
import type { ProductCardRow } from "@skinsavior/core/types";
import { ProductThumb } from "@/components/ProductThumb";
import { prettyCategory } from "@/components/products/prettyCategory";

/** Catalog product card in the grid view. */
export function GridCard({ p }: { p: ProductCardRow }) {
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
