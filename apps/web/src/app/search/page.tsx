import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ProductsExplorer } from "@/components/products/ProductsExplorer";
import { listDbProductsPage, listProductCategories } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "Products",
  description: "Search and browse skincare products by type.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [categories, initialPage] = await Promise.all([
    listProductCategories(),
    listDbProductsPage({ q, offset: 0 }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main className="mx-auto max-w-[1080px] px-6 py-10 md:px-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[13px] text-muted-foreground">Products / Browse</div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">
              Products
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Every product in the catalog. Filter by type, or search by name, brand, or
              ingredient.
            </p>
          </div>
          <Link
            href="/add"
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span aria-hidden="true">+</span> Add product
          </Link>
        </div>

        <ProductsExplorer
          categories={categories}
          initialPage={initialPage}
          initialQ={q}
        />
      </main>
    </div>
  );
}
