// Storybook-only hard stop for Supabase. Even if the
// NEXT_PUBLIC_SUPABASE_DISABLED env flag were somehow unset in a story, the
// vite aliases in main.ts point @/lib/supabase/{client,server,admin} here, so a
// story can never construct a real Supabase client or hit the network.
//
// Reuses the existing no-op client so behaviour matches the app's own kill
// switch (src/lib/supabase/mock.ts).
import { createMockClient } from "../src/lib/supabase/mock";

const mock = createMockClient();

// Covers client.ts's `createClient()` (sync) and server.ts's `await
// createClient()` (awaiting a plain value is fine).
export function createClient() {
  return mock;
}

// client.ts's singleton proxy.
export const supabase = mock;

// admin.ts's service-role proxy.
export const supabaseAdmin = mock;
