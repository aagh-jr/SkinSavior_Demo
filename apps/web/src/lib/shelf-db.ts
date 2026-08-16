// "My shelf" — the signed-in user's products and routines.
//
// Two distinct senses of "my products", kept separate because they mean
// different things to a user:
//
//   IN USE  — attached to a routine step. These are what they actually put on
//             their face, and what the compatibility checks reason about.
//   SAVED   — bookmarked to consider later. Interest, not usage.
//
// Everything reads through the cookie-aware client, so RLS guarantees a user
// only ever sees their own shelf.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export interface ShelfProduct {
  productId: string;
  slug: string | null;
  name: string;
  brand: string;
  imageUrl: string | null;
  category: string | null;
  /** Routine names this product appears in — empty for saved-only products. */
  usedIn: string[];
  savedAt: string | null;
  note: string | null;
}

interface StepRow {
  product_id: string | null;
  products: {
    id: string;
    slug: string | null;
    name: string;
    brand: string;
    image_url: string | null;
    canonical_category: string | null;
  } | null;
  skincare_routines: { name: string } | null;
}

interface SavedRow {
  product_id: string;
  note: string | null;
  created_at: string;
  products: {
    id: string;
    slug: string | null;
    name: string;
    brand: string;
    image_url: string | null;
    canonical_category: string | null;
  } | null;
}

const PRODUCT_COLS = "id, slug, name, brand, image_url, canonical_category";

/**
 * Products attached to any of the user's routines, with the routines they
 * appear in.
 *
 * A product used in both an AM and a PM routine is one entry listing both,
 * rather than two rows — the shelf is a list of things you own.
 */
export async function getProductsInUse(): Promise<ShelfProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const db = supabase as unknown as SupabaseClient;
  const { data } = await db
    .from("routine_steps")
    .select(`product_id, products(${PRODUCT_COLS}), skincare_routines!inner(name, profile_id)`)
    .eq("skincare_routines.profile_id", user.id)
    .not("product_id", "is", null);

  const byProduct = new Map<string, ShelfProduct>();
  for (const row of (data ?? []) as unknown as StepRow[]) {
    const p = row.products;
    if (!p) continue;
    const existing = byProduct.get(p.id);
    const routineName = row.skincare_routines?.name;
    if (existing) {
      if (routineName && !existing.usedIn.includes(routineName)) {
        existing.usedIn.push(routineName);
      }
      continue;
    }
    byProduct.set(p.id, {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      imageUrl: p.image_url,
      category: p.canonical_category,
      usedIn: routineName ? [routineName] : [],
      savedAt: null,
      note: null,
    });
  }
  return [...byProduct.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Products the user has bookmarked, most recently saved first. */
export async function getSavedProducts(): Promise<ShelfProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from("saved_products")
    .select(`product_id, note, created_at, products(${PRODUCT_COLS})`)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  // The table arrives with migration 20260812000000; until it's applied the
  // shelf should still render its other sections rather than 500.
  if (error) return [];

  return ((data ?? []) as unknown as SavedRow[])
    .filter((r) => r.products)
    .map((r) => ({
      productId: r.products!.id,
      slug: r.products!.slug,
      name: r.products!.name,
      brand: r.products!.brand,
      imageUrl: r.products!.image_url,
      category: r.products!.canonical_category,
      usedIn: [],
      savedAt: r.created_at,
      note: r.note,
    }));
}

/**
 * What the product page needs to render its save button: the catalog id (the
 * page only knows the slug), whether it's already saved, and whether anyone is
 * signed in. Static demo products have no catalog row, so productId is null
 * and the button hides.
 */
export async function getSaveStateBySlug(slug: string): Promise<{
  productId: string | null;
  saved: boolean;
  signedIn: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { productId: null, saved: false, signedIn: false };

  const db = supabase as unknown as SupabaseClient;
  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const productId = (product as { id: string } | null)?.id ?? null;
  if (!productId) return { productId: null, saved: false, signedIn: true };

  const { data, error } = await db
    .from("saved_products")
    .select("id")
    .eq("profile_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  return { productId, saved: !error && Boolean(data), signedIn: true };
}

/** Is this product on the user's saved list? Drives the save button state. */
export async function isProductSaved(productId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db
    .from("saved_products")
    .select("id")
    .eq("profile_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
