import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Consume the workspace package as TypeScript source (no build step).
  transpilePackages: ["@skinsavior/core"],
  eslint: {
    // Lint is run separately via `turbo run lint`; don't fail production builds on it.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
