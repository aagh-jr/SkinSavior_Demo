"use client";

import { useSession } from "@/hooks/useSession";
import { SiteNavView } from "@/components/SiteNavView";

/**
 * Primary site navigation. Thin wrapper: useSession owns the Supabase auth
 * session and avatar; SiteNavView renders it.
 */
export function SiteNav() {
  const { auth, avatarUrl, signOut } = useSession();
  return <SiteNavView auth={auth} avatarUrl={avatarUrl} onSignOut={() => void signOut()} />;
}
