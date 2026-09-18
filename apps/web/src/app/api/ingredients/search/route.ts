import { NextResponse } from "next/server";
import { listIngredients } from "@/lib/ingredients-db";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });
  try {
    const page = await listIngredients({ q, limit: 5 });
    return NextResponse.json({ results: page.rows.map((row) => ({ id: row.id, name: row.common_name?.trim() || row.inci_name })) });
  } catch {
    return NextResponse.json({ error: "Ingredient search unavailable." }, { status: 503 });
  }
}
