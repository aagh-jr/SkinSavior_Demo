import Link from "next/link";
import type { ShelfProduct } from "@skinsavior/core/types";
import { ProductThumb } from "@/components/ProductThumb";

/** Grid of shelf products (in-use or saved), each linking to its product page. */
export function ProductGrid({ products }: { products: ShelfProduct[] }) {
  return (
    <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const body = (
          <div className="flex h-full gap-4 rounded-[16px] border border-border bg-white p-4 transition-colors hover:border-clay">
            <div className="h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-[12px] border border-border">
              <ProductThumb
                category={p.category}
                imageUrl={p.imageUrl}
                name={p.name}
                className="h-full w-full"
                iconSize={28}
                sizes="70px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-serif text-[15px] leading-snug text-ink">
                {p.name}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-link">
                {p.brand}
              </p>
              {p.usedIn.length > 0 && (
                <p className="mt-1.5 line-clamp-1 text-[12px] text-muted-foreground">
                  in {p.usedIn.join(", ")}
                </p>
              )}
              {p.note && (
                <p className="mt-1.5 line-clamp-2 text-[12px] italic text-muted-foreground">
                  {p.note}
                </p>
              )}
            </div>
          </div>
        );
        return (
          <li key={p.productId}>
            {/* Ingested products always have a slug; guard anyway so a legacy
                row without one renders as a card rather than a broken link. */}
            {p.slug ? <Link href={`/product/${p.slug}`}>{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}
