import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/** Supabase client typed against the project's generated `Database` schema. */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Structural shape of a session-storage adapter. Web uses `localStorage`
 * automatically; React Native (Expo) should pass `AsyncStorage`.
 */
export interface SupabaseAuthStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface CreateSupabaseClientOptions {
  /** Project URL. Web: `NEXT_PUBLIC_SUPABASE_URL`. Mobile: `EXPO_PUBLIC_SUPABASE_URL`. */
  url: string;
  /** Anon/publishable key. Web: `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Mobile: `EXPO_PUBLIC_SUPABASE_ANON_KEY`. */
  anonKey: string;
  /** Auth session storage. Omit on web (defaults to localStorage); pass AsyncStorage on React Native. */
  storage?: SupabaseAuthStorage;
  /** Persist the auth session across reloads. Default: true. */
  persistSession?: boolean;
  /**
   * Parse the session from a URL fragment after OAuth redirects.
   * Default: true in a browser, false elsewhere. Set false on React Native.
   */
  detectSessionInUrl?: boolean;
}

/**
 * Create a Supabase client that is safe to share across web and native.
 *
 * Each app injects its own env-sourced `url`/`anonKey` so this package stays
 * framework-agnostic. For Next.js Server Components / Route Handlers you'll
 * want a per-request cookie-aware client (via `@supabase/ssr`) — that helper
 * will be added in the web app during Phase 3.
 */
export function createSupabaseClient(
  opts: CreateSupabaseClientOptions,
): TypedSupabaseClient {
  const { url, anonKey, storage, persistSession = true } = opts;

  if (!url || !anonKey) {
    const missing = [!url && "url", !anonKey && "anonKey"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[@skinsavior/core] createSupabaseClient: missing required option(s): ${missing}.`,
    );
  }

  const isBrowser = typeof window !== "undefined";
  const detectSessionInUrl = opts.detectSessionInUrl ?? isBrowser;

  return createClient<Database>(url, anonKey, {
    auth: {
      storage: storage ?? (isBrowser ? window.localStorage : undefined),
      persistSession,
      autoRefreshToken: true,
      detectSessionInUrl,
    },
  });
}
