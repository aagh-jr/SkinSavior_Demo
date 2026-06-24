import { QueryClient } from "@tanstack/react-query";

/**
 * Shared TanStack Query client factory used by both the web (Next.js) and
 * mobile (Expo) apps so caching/retry defaults stay consistent.
 *
 * Create one instance per app runtime. In Next.js App Router, call this once
 * on the server per request and once in the browser (a module-level singleton
 * guarded by `typeof window`) — that wiring lives in the web app.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
