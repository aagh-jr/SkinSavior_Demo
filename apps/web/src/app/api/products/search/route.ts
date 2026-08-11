// GET /api/products/search?q=… — lightweight catalog search for the SiteNav
// typeahead and the routine builder's product picker. Returns only the fields
// those two render (the builder needs `id` to create routine steps).

import { NextResponse } from "next/server";
import { searchDbProductRows } from "@/lib/products-db";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  const results = (await searchDbProductRows(q, 10)).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category ?? "Other",
    imageUrl: p.image_url,
  }));
  return NextResponse.json({ results });
}
