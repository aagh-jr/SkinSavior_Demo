import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@skinsavior/core/supabase";
import { createMockClient, isSupabaseDisabled } from "./mock";

// Per-request, cookie-aware Supabase client for Server Components, Route
// Handlers, and Server Actions. RLS applies as the signed-in user.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mock data is available only through the explicit development switch.
  if (isSupabaseDisabled()) {
    return createMockClient() as ReturnType<typeof createServerClient<Database>>;
  }
  if (!url || !anonKey) {
    throw new Error("Supabase configuration missing. Configure database credentials, or explicitly set NEXT_PUBLIC_SUPABASE_DISABLED=true for offline development.");
  }


  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` was called from a Server Component — safe to ignore when
          // middleware is refreshing the session.
        }
      },
    },
  });
}
