import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { listBrands, type BrandSummary } from "@/lib/brands-db";

export const metadata: Metadata = {
  title: "Brands",
  description: "Every brand in the skinsavior catalog, A to Z.",
};

/**
 * A-to-Z brand index.
 *
 * Replaces a grid of monogram cards — a coloured circle with the brand's
 * first initial, invented because there are no brand logos. At 400+ brands
 * that grid was a wall of decoration you had to scroll through to find
 * anything, and the monograms carried no information the brand name didn't
 * already give.
 *
 * This is a known-item navigation: someone arriving here has a brand in mind.
 * An alphabet jump bar plus plain text columns gets them there in one click,
 * which is why every large retail catalogue converges on this pattern.
 */

/** Bucket a brand under a letter; anything non-alphabetic goes to "#". */
function bucketOf(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export default async function BrandsPage() {
  const brands = await listBrands();

  // listBrands() sorts by product count; an index needs alphabetical.
  const byLetter = new Map<string, BrandSummary[]>();
  for (const brand of [...brands].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = bucketOf(brand.name);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), brand]);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
        <div className="mb-2 text-[13px] text-muted-foreground">Catalog / Brands</div>
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">
          Brands
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {brands.length} brands in the catalog. Open one to see its products.
        </p>

        {/* Alphabet jump bar. Letters with no brands are shown but inert, so
            the row stays a stable ruler rather than reflowing per catalogue. */}
        <nav
          aria-label="Jump to letter"
          className="sticky top-[72px] z-20 -mx-2 mt-8 flex flex-wrap gap-0.5 border-b border-border bg-background/95 px-2 py-3 backdrop-blur"
        >
          {LETTERS.map((letter) => {
            const has = (byLetter.get(letter)?.length ?? 0) > 0;
            return has ? (
              <Link
                key={letter}
                href={`#letter-${letter === "#" ? "num" : letter}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-medium text-ink transition-colors hover:bg-secondary"
              >
                {letter}
              </Link>
            ) : (
              <span
                key={letter}
                aria-hidden
                className="flex h-8 w-8 items-center justify-center text-[13px] text-[#cfc4b2]"
              >
                {letter}
              </span>
            );
          })}
        </nav>

        {brands.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
            No brands yet — add a product to get started.
          </div>
        ) : (
          LETTERS.filter((l) => byLetter.get(l)?.length).map((letter) => (
            <section
              key={letter}
              id={`letter-${letter === "#" ? "num" : letter}`}
              // Offset so the sticky nav doesn't cover the heading on jump.
              className="scroll-mt-[132px] border-b border-border py-7 last:border-b-0"
            >
              <h2 className="m-0 font-serif text-[28px] font-medium leading-none text-clay">
                {letter}
              </h2>
              <ul className="mt-4 grid list-none grid-cols-1 gap-x-8 gap-y-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {byLetter.get(letter)!.map((brand) => (
                  <li key={brand.slug}>
                    <Link
                      href={`/brands/${brand.slug}`}
                      className="group flex items-baseline justify-between gap-3 rounded-md py-1.5 transition-colors hover:text-clay"
                    >
                      <span className="min-w-0 truncate text-[15px] text-ink group-hover:text-clay">
                        {brand.name}
                      </span>
                      <span className="flex-shrink-0 font-mono text-[12px] text-muted-foreground">
                        {brand.productCount}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
