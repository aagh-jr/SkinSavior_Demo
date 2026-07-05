// TEMPORARY: no-op Supabase client used while the real connection is
// disconnected. Enabled by the NEXT_PUBLIC_SUPABASE_DISABLED env flag and
// consumed by ./client, ./server, and ./admin.
//
// Why this exists: AI design tools render the app in a sandbox with no network
// access (and/or no valid Supabase creds), so any real Supabase call throws and
// crashes the page. This stub returns empty data, never makes a network call,
// and never throws — so every page renders for design work.
//
// To reconnect: set NEXT_PUBLIC_SUPABASE_DISABLED=false (or remove it) in
// .env.local. To remove the kill switch entirely, delete this file and the
// `isSupabaseDisabled()` guards in client.ts / server.ts / admin.ts.

/** True when the Supabase connection has been temporarily disabled via env. */
export function isSupabaseDisabled(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_DISABLED === "true";
}

// A PostgREST-style result. `data: null` keeps every consumer on its
// "no data" path (e.g. notFound(), "No saved products yet").
const EMPTY_RESULT = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: "OK",
};

// A chainable, awaitable query builder. Any method (.select, .eq, .order,
// .maybeSingle, .upsert, …) returns the same proxy, and awaiting it resolves
// to EMPTY_RESULT.
function makeQuery(): any {
  const result = Promise.resolve(EMPTY_RESULT);
  const proxy: any = new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "then") return result.then.bind(result);
      if (prop === "catch") return result.catch.bind(result);
      if (prop === "finally") return result.finally.bind(result);
      // Every builder method is chainable.
      return () => proxy;
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

const auth = {
  getUser: async () => ({ data: { user: null }, error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: null,
  }),
  signInWithOAuth: async () => ({
    data: { provider: "", url: "" },
    error: null,
  }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe() {} } },
  }),
};

/**
 * A stand-in for a Supabase client that resolves everything to empty data.
 * Typed as `any` on purpose — it structurally satisfies the call sites without
 * pulling in the full generated client types.
 */
export function createMockClient(): any {
  return {
    from: () => makeQuery(),
    rpc: () => makeQuery(),
    auth,
    storage: {
      from: () => ({
        upload: async () => EMPTY_RESULT,
        download: async () => EMPTY_RESULT,
        remove: async () => EMPTY_RESULT,
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };
}
