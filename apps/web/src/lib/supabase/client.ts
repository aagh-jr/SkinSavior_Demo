import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@skinsavior/core/supabase";

// Browser Supabase client for use in Client Components.
//
// Replaces the old Lovable Cloud client. Uses @supabase/ssr so the auth
// session is stored in cookies and stays in sync with the server client
// (src/lib/supabase/server.ts). Typed against the shared Database schema
// from @skinsavior/core.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.example.",
    );
  }
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Lazy singleton — instantiated on first access (browser only), so importing
// this module never throws at build/SSR time.
let _client: ReturnType<typeof createClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    if (!_client) _client = createClient();
    return Reflect.get(_client, prop, receiver);
  },
});
