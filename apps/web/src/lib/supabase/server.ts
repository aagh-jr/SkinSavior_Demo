import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@skinsavior/core/supabase";
import { createMockClient, isSupabaseDisabled } from "./mock";

// Per-request, cookie-aware Supabase client for Server Components, Route
// Handlers, and Server Actions. RLS applies as the signed-in user.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // TEMPORARY: explicit kill switch, or auto-fallback when Supabase env is
  // absent (e.g. AI design tools that pull the repo with no .env). Either way
  // we return a no-op mock so the app renders instead of crashing. See ./mock.
  if (isSupabaseDisabled() || !url || !anonKey) {
    return createMockClient() as ReturnType<typeof createServerClient<Database>>;
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
