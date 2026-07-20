// Server-only admin gate. The app has no role system — curation surfaces like
// /review are gated by an ADMIN_EMAILS allowlist (comma-separated, matched
// case-insensitively against the signed-in user's email). Unset env means
// nobody is admin. Server actions must re-check this themselves: actions are
// public endpoints, and a page-level gate alone protects nothing.

import { createClient } from "@/lib/supabase/server";

export async function isAdminUser(): Promise<boolean> {
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowlist.length) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  return !!email && allowlist.includes(email);
}
