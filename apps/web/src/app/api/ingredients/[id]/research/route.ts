import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Read-only public research; no external fetches or service-role writes. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid ingredient id." }, { status: 400 });
  const db = (await createClient()) as unknown as SupabaseClient;
  const { data, error } = await db.from("research_papers")
    .select("pmid, title, abstract, journal, year, publication_types, doi, pubmed_url, rank")
    .eq("ingredient_id", parsed.data.id).order("rank").limit(5);
  if (error) return NextResponse.json({ papers: [], status: "error" }, { status: 503 });
  return NextResponse.json({ papers: data ?? [], status: data?.length ? "ok" : "empty" });
}
