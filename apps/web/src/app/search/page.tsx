import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { ProductsExplorer } from "@/components/products/ProductsExplorer";
import { listDbProductsPage, listProductCategories } from "@/lib/products-db";

export const metadata: Metadata = {
  title: "Search",
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

      <main className="mx-auto max-w-[1180px] px-6 py-9 md:px-14">
        <ProductsExplorer
          categories={categories}
          initialPage={initialPage}
          initialQ={q}
        />
      </main>
    </div>
  );
}
