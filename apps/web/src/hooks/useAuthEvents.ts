"use client";

import { useEffect, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthEventHandler = (event: AuthChangeEvent, session: Session | null) => void;

/**
 * Subscribe to Supabase auth state changes. Keeps a single subscription alive
 * (resubscribing only when `enabled` flips) while always invoking the latest
 * handler, so callers can pass an inline closure without churning the
 * subscription. Keeps Supabase access out of behavior components.
 */
export function useAuthEvents(handler: AuthEventHandler, enabled = true): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      handlerRef.current(event, session);
    });
    return () => sub.subscription.unsubscribe();
  }, [enabled]);
}
