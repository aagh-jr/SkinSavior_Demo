import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skinsavior/core/supabase";
import { createMockClient, isSupabaseDisabled } from "./mock";

// Service-role Supabase client — bypasses RLS. SERVER-ONLY.
//
// SECURITY: never import this from a Client Component. It reads
// SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix), which is undefined in the
// browser, so an accidental client import will throw rather than leak the key.
// Replaces the old auto-generated integrations/supabase/client.server.ts.
function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // TEMPORARY: explicit kill switch, or auto-fallback when Supabase env is
  // absent (e.g. AI design tools that pull the repo with no .env). Either way
  // we return a no-op mock so the app renders instead of crashing. See ./mock.
  if (isSupabaseDisabled() || !url || !serviceRoleKey) {
    return createMockClient() as ReturnType<typeof createSupabaseClient<Database>>;
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _admin: ReturnType<typeof createAdminClient> | undefined;

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createAdminClient>,
  {
    get(_target, prop, receiver) {
      if (!_admin) _admin = createAdminClient();
      return Reflect.get(_admin, prop, receiver);
    },
  },
);
