"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@skinsavior/core/query";
import { Toaster } from "@/components/ui/sonner";

// App-wide client providers. Uses the shared QueryClient factory from
// @skinsavior/core so web and mobile share caching defaults.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
