import {
  Atom,
  Droplets,
  Dumbbell,
  Grid2x2,
  Layers,
  Leaf,
  Palette,
  Shield,
  Shrink,
  Snowflake,
  Sun,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { ClaimBadgeSlug } from "@skinsavior/core/research";

/**
 * Placeholder icons for the claim badges — one lucide glyph per benefit, so
 * every rendered claim carries a quick visual cue alongside its label. These
 * are stand-ins until we have bespoke artwork; the mapping is intentionally
 * loose (Wind = mattifying, Snowflake = calming redness, etc.).
 *
 * Only the cosmetic + borderline badges appear here. The `prohibited` badges
 * are never surfaced to users (docs/claims-policy.md), so a missing slug just
 * renders no icon rather than throwing.
 */
const ICONS: Partial<Record<ClaimBadgeSlug, LucideIcon>> = {
  "evens-tone": Palette,
  brightens: Sun,
  "smooths-wrinkles": Waves,
  firms: Dumbbell,
  hydrates: Droplets,
  "smooths-texture": Grid2x2,
  "minimizes-pores": Shrink,
  "controls-oil": Wind,
  "reduces-redness": Snowflake,
  soothes: Leaf,
  "supports-barrier": Shield,
  antioxidant: Atom,
  "supports-collagen": Layers,
};

export function ClaimBadgeIcon({
  slug,
  className,
}: {
  slug: ClaimBadgeSlug;
  className?: string;
}) {
  const Icon = ICONS[slug];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}
