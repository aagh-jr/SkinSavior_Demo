import type { Metadata } from "next";
import type { BrandSummary } from "@skinsavior/core/types";
import { SiteNav } from "@/components/SiteNav";
import { AlphabetJumpBar } from "@/components/brands/AlphabetJumpBar";
import { BrandLetterSection } from "@/components/brands/BrandLetterSection";
import { listBrands } from "@/lib/brands-db";

export const dynamic = "force-dynamic";

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

        <AlphabetJumpBar
          letters={LETTERS}
          activeLetters={new Set(LETTERS.filter((l) => byLetter.get(l)?.length))}
        />

        {brands.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-warm-white px-6 py-12 text-center text-sm text-muted-foreground">
            No brands yet — add a product to get started.
          </div>
        ) : (
          LETTERS.filter((l) => byLetter.get(l)?.length).map((letter) => (
            <BrandLetterSection key={letter} letter={letter} brands={byLetter.get(letter)!} />
          ))
        )}
      </main>
    </div>
  );
}
