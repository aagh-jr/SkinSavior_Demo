import type { ReactNode, SVGProps } from "react";
import type { RoutineCategory } from "@/lib/routine-categories";

// Custom line icons for each skincare product category. Drawn in Lucide's
// house style (24×24 grid, currentColor stroke, round caps/joins) so they sit
// alongside the lucide-react icons already used elsewhere. Colour and size are
// inherited from the parent via `currentColor` + the `size` prop.
const GLYPHS: Record<RoutineCategory, ReactNode> = {
  // Dropper bottle with an oil droplet inside.
  oil_cleanser: (
    <>
      <path d="M9 8h6" />
      <path d="M10 8v2M14 8v2" />
      <rect x="8" y="10" width="8" height="11" rx="2" />
      <path d="M12 13c1.2 1.6 2 2.7 2 3.7a2 2 0 0 1-4 0c0-1 .8-2.1 2-3.7z" />
    </>
  ),
  // Pump bottle.
  cleanser: (
    <>
      <rect x="8" y="10" width="8" height="11" rx="2" />
      <path d="M10 10V7h4v3" />
      <path d="M12 7V4h3" />
    </>
  ),
  // Jar with scrub granules.
  exfoliant: (
    <>
      <rect x="7" y="9" width="10" height="12" rx="2" />
      <path d="M7 12.5h10" />
      <circle cx="10.5" cy="16" r=".55" />
      <circle cx="13.5" cy="15.3" r=".55" />
      <circle cx="12" cy="18" r=".55" />
      <circle cx="14.3" cy="18" r=".55" />
      <circle cx="9.8" cy="18.6" r=".55" />
    </>
  ),
  // Sheet mask — a face silhouette with eye + mouth cutouts.
  mask: (
    <>
      <path d="M12 3c4 0 7 2 7 7 0 5-3 11-7 11s-7-6-7-11c0-5 3-7 7-7z" />
      <path d="M8.5 10h2M13.5 10h2" />
      <path d="M10 14.5h4" />
    </>
  ),
  // A droplet landing on a round cotton pad.
  toner: (
    <>
      <path d="M12 3.5c.8 1 1.3 1.7 1.3 2.4a1.3 1.3 0 0 1-2.6 0c0-.7.5-1.4 1.3-2.4z" />
      <circle cx="12" cy="14" r="6" />
      <circle cx="12" cy="14" r="2.5" />
    </>
  ),
  // Slim tall bottle with a label band.
  essence: (
    <>
      <path d="M10 5h4" />
      <path d="M10.5 5v2M13.5 5v2" />
      <rect x="9" y="7" width="6" height="14" rx="2" />
      <path d="M9 12h6" />
    </>
  ),
  // Classic serum pipette / dropper.
  serum: (
    <>
      <rect x="9.5" y="3" width="5" height="3" rx="1" />
      <path d="M11 6v8.5M13 6v8.5" />
      <path d="M11 14.5 12 21l1-6.5" />
    </>
  ),
  // Eye.
  eye_cream: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  // Target with a centre dot.
  spot_treatment: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  // Wide cream jar with a lid.
  moisturizer: (
    <>
      <rect x="5" y="9" width="14" height="11" rx="2" />
      <path d="M5 13h14" />
      <path d="M8 9V7h8v2" />
    </>
  ),
  // A large oil droplet with a highlight.
  face_oil: (
    <>
      <path d="M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z" />
      <path d="M9.6 13a2.5 2.5 0 0 0 2 2.3" />
    </>
  ),
  // Lip-balm stick with a rounded balm dome.
  lip_balm: (
    <>
      <rect x="8" y="10" width="8" height="11" rx="2" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  // Sun.
  sunscreen: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  // Sparkle — the catch-all "other".
  other: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
};

export interface CategoryIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  category: RoutineCategory | string;
  /** Pixel size for width & height. Defaults to 24 (Lucide default). */
  size?: number;
}

export function CategoryIcon({ category, size = 24, ...props }: CategoryIconProps) {
  const glyph = GLYPHS[category as RoutineCategory] ?? GLYPHS.other;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {glyph}
    </svg>
  );
}
