import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skinsavior/core/supabase";

// Service-role Supabase client — bypasses RLS. SERVER-ONLY.
//
// SECURITY: never import this from a Client Component. It reads
// SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix), which is undefined in the
// browser, so an accidental client import will throw rather than leak the key.
// Replaces the old auto-generated integrations/supabase/client.server.ts.
function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "[supabase] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for the admin client.",
    );
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
