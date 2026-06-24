/**
 * Cross-platform design tokens for skinsavior.
 *
 * Plain values (no DOM, no React Native imports) so both the web app (Tailwind
 * v4 / CSS variables) and the mobile app (NativeWind / Tailwind v3 config) can
 * consume the same palette. The hex values mirror the oklch tokens defined in
 * apps/web/src/app/globals.css.
 *
 * NOTE: the existing shadcn/Radix primitives are DOM-only and intentionally
 * stay in apps/web — only platform-agnostic tokens/logic live in @skinsavior/ui.
 */

export const colors = {
  /** App background — cream */
  cream: "#f6f1e9",
  /** Default text — warm near-black */
  foreground: "#2a241d",
  /** Headings / strongest ink */
  ink: "#1d1812",
  /** Card / elevated surface */
  warmWhite: "#fdfbf6",
  /** Hairline borders */
  softTan: "#e6ddcf",
  /** Primary / brand — terracotta clay */
  clay: "#9a4a2f",
  /** Secondary warm tan */
  secondary: "#fbf3ec",
  /** Muted text */
  muted: "#6b5f4f",
  /** Accent */
  accent: "#caa37f",
  /** Success / evidence — sage */
  sage: "#4a6b3f",
  /** Sage background tint */
  sageBg: "#eef3ea",
  white: "#ffffff",
} as const;

export type ColorToken = keyof typeof colors;

/** Base radius scale (px), matching the web --radius of 0.75rem = 12px. */
export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fonts = {
  serif: "Newsreader",
  sans: "Hanken Grotesk",
  mono: "Space Grotesk",
} as const;
