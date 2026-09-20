import Link from "next/link";
import type { ProductCardRow } from "@skinsavior/core/types";
import { ProductThumb } from "@/components/ProductThumb";
import { prettyCategory } from "@/components/products/prettyCategory";

/** Catalog product card in the list view. */
export function ListCard({ p }: { p: ProductCardRow }) {
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
