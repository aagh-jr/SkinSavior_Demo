import Link from "next/link";
import type { BrandSummary } from "@skinsavior/core/types";

/** One alphabetized section of the brand index: a letter heading and its brands. */
export function BrandLetterSection({
  letter,
  brands,
}: {
  letter: string;
  brands: BrandSummary[];
}) {
  return (
    <section
      id={`letter-${letter === "#" ? "num" : letter}`}
      // Offset so the sticky nav doesn't cover the heading on jump.
      className="scroll-mt-[132px] border-b border-border py-7 last:border-b-0"
    >
      <h2 className="m-0 font-serif text-[28px] font-medium leading-none text-link">
        {letter}
      </h2>
      <ul className="mt-4 flex list-none flex-wrap gap-x-10 gap-y-2 p-0">
        {brands.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/brands/${brand.slug}`}
              className="text-[15px] text-ink transition-colors hover:text-link"
            >
              {brand.name} <span className="text-muted-foreground">({brand.productCount})</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
