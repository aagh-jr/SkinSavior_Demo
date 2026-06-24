// Metro config for an Expo app inside a Bun workspace monorepo.
// Watches the workspace root so shared packages (@skinsavior/core, /ui) resolve,
// and wraps NativeWind for Tailwind-in-RN.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root too, so shared packages (@skinsavior/core, /ui)
// are picked up by Metro. Append to Expo's defaults rather than replacing them.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// Resolve modules from the app first, then the hoisted workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
