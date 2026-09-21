/**
 * Fake user/session data for Storybook.
 *
 * The presentational nav (SiteNavView) takes { auth, avatarUrl, onSignOut }, so
 * these mirror the three states useSession can return, plus a completed skin
 * profile for screens that read one. No real auth, no Supabase.
 */
import type { AuthState } from "@/hooks/useSession";

/** A local avatar so the signed-in nav shows a photo with no network. */
export const AVATAR_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#2F6FED"/><text x="40" y="50" font-family="sans-serif" font-size="32" fill="#fff" text-anchor="middle">MR</text></svg>`,
  );

export interface SessionProps {
  auth: AuthState;
  avatarUrl: string | null;
  onSignOut: () => void;
}

const noop = () => {};

export const signedInSession: SessionProps = {
  auth: "in",
  avatarUrl: AVATAR_IMAGE,
  onSignOut: noop,
};

/** Signed in but no chosen avatar — the generic user glyph path. */
export const signedInNoAvatarSession: SessionProps = {
  auth: "in",
  avatarUrl: null,
  onSignOut: noop,
};

export const signedOutSession: SessionProps = {
  auth: "out",
  avatarUrl: null,
  onSignOut: noop,
};

export const loadingSession: SessionProps = {
  auth: "loading",
  avatarUrl: null,
  onSignOut: noop,
};

/**
 * A completed skin profile (quiz answers). No shared TS type exists for this
 * yet, so the shape is declared here. "prefer_not_to_say" for pregnancy is a
 * deliberate case — it must never trigger a warning (AGENTS.md).
 */
export interface SkinProfile {
  displayName: string;
  skinType: "dry" | "oily" | "combination" | "normal" | "sensitive";
  concerns: string[];
  goals: string[];
  budget: string[];
  reactions: string[];
  pregnancy: "yes" | "no" | "prefer_not_to_say";
}

export const completedProfile: SkinProfile = {
  displayName: "Maya",
  skinType: "combination",
  concerns: ["Excess oil", "Enlarged pores", "Uneven tone"],
  goals: ["Smoother texture", "Less shine"],
  budget: ["$", "$$"],
  reactions: ["Fragrance"],
  pregnancy: "no",
};

/** Declines to disclose pregnancy — must be treated as "not yes", no warnings. */
export const undisclosedPregnancyProfile: SkinProfile = {
  ...completedProfile,
  displayName: "Sam",
  pregnancy: "prefer_not_to_say",
};
