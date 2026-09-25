"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/** "loading" until the session is known, so callers don't flash the wrong UI. */
export type AuthState = "loading" | "in" | "out";

export interface SessionState {
  auth: AuthState;
  /** The signed-in user's saved avatar photo, or null. */
  avatarUrl: string | null;
  /** Sign out, then send the user to the landing page. */
  signOut: () => Promise<void>;
}

/**
 * Data hook that tracks the Supabase auth session on the client and the
 * signed-in user's avatar. Keeps all Supabase access out of the nav component.
 */
export function useSession(): SessionState {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    // Pull the signed-in user's saved photo so the nav icon matches the
    // avatar chosen in Settings. Falls back to the generic user glyph.
    async function loadAvatar(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      const url = (data as { avatar_url: string | null } | null)?.avatar_url;
      setAvatarUrl(url && url.toUpperCase() !== "NULL" ? url : null);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuth(data.user ? "in" : "out");
      if (data.user) void loadAvatar(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session ? "in" : "out");
      if (session?.user) void loadAvatar(session.user.id);
      else setAvatarUrl(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    // onAuthStateChange flips the nav to signed-out; send them to the landing.
    router.push("/");
    router.refresh();
  }

  return { auth, avatarUrl, signOut };
}
