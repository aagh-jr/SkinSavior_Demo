// Vitest stub for the `server-only` package. In a Next.js server build
// `server-only` is aliased to a no-op; its real entry throws on import so a
// client bundle can never pull in server code. Under Vitest (plain Node) that
// throw would fail any test that imports a `server-only`-guarded module, so we
// alias `server-only` to this empty module in vitest.config.ts.
export {};
