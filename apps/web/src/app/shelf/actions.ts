"use server";

// Save / unsave a product. RLS enforces ownership — these never take a
// profile id from the client, only from the session.

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: true; saved: boolean } | { ok: false; error: string };

export async function toggleSavedAction(productId: string): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to save products." };

  const db = supabase as unknown as SupabaseClient;

  const { data: existing } = await db
    .from("saved_products")
    .select("id")
    .eq("profile_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("saved_products")
      .delete()
      .eq("profile_id", user.id)
      .eq("product_id", productId);
    if (error) return { ok: false, error: "Couldn't remove that. Try again." };
    revalidatePath("/shelf");
    return { ok: true, saved: false };
  }

  const { error } = await db
    .from("saved_products")
    .insert({ profile_id: user.id, product_id: productId });
  // unique(profile_id, product_id) makes a double-click a no-op rather than a
  // duplicate row, so treat a conflict as already-saved.
  if (error && error.code !== "23505") {
    return { ok: false, error: "Couldn't save that. Try again." };
  }
  revalidatePath("/shelf");
  return { ok: true, saved: true };
}
