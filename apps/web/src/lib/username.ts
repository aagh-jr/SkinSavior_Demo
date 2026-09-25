import { supabase } from "@/lib/supabase/client";

// Usernames are the handle in /user/[username], so they're kept URL-safe and
// lowercase. The database index on profiles.username is case-sensitive, so
// lowercasing here is what stops "Abel" and "abel" from both being claimed.
//
// The same rule is enforced in handle_new_user() (see migration
// 20260925120000_username_at_signup.sql) — keep the two in sync.
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Returns an error message, or null when the username is well-formed. */
export function validateUsername(username: string): string | null {
  if (!username) return "Choose a username.";
  if (username.length < 3) return "Usernames need at least 3 characters.";
  if (username.length > 20) return "Usernames can be at most 20 characters.";
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only lowercase letters, numbers and underscores.";
  }
  return null;
}

/**
 * Checks the public profiles view for an existing claim. Throws on a failed
 * lookup rather than returning "available": a network error is not evidence
 * that nobody has the name.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("public_profiles")
    .select("username")
    .eq("username", username)
    .limit(1);
  if (error) throw new Error("Couldn't check that username. Try again.");
  return (data ?? []).length > 0;
}
