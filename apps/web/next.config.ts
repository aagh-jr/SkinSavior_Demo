import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Consume the workspace package as TypeScript source (no build step).
  transpilePackages: ["@skinsavior/core"],
  eslint: {
    // Lint is run separately via `turbo run lint`; don't fail production builds on it.
    ignoreDuringBuilds: true,
  },
  images: {
    // Catalog photography hosts. Declared so next/image can resize and
    // re-encode them — essential because we now request the FULL-size Open
    // Beauty Facts original (~950 KB) rather than its soft 400px thumbnail.
    // Without optimisation those megabytes would reach the browser intact.
    remotePatterns: [
      { protocol: "https", hostname: "images.openbeautyfacts.org" },
      { protocol: "https", hostname: "incidecoder-content.storage.googleapis.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.shopify.com" },
      { protocol: "https", hostname: "beautyofjoseon.com" },
      { protocol: "https", hostname: "theordinary.com" },
      { protocol: "https", hostname: "www.paulaschoice.com" },
    ],
  },
};

export default nextConfig;
