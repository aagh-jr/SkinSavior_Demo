import type { StorybookConfig } from '@storybook/nextjs-vite';

import { dirname, resolve } from "path"

import { fileURLToPath } from "url"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-mcp')
  ],
  "framework": getAbsolutePath('@storybook/nextjs-vite'),
  "staticDirs": [
    "../public"
  ],
  // Phase 2 safety net: even if a story forgot the env flag, these aliases make
  // it structurally impossible to construct a real Supabase client. They are
  // prepended so they win over the framework's general `@` -> ./src alias.
  async viteFinal(config) {
    const here = dirname(fileURLToPath(import.meta.url));
    const shim = resolve(here, "supabase-mock.ts");
    const actionStub = resolve(here, "action-stubs.ts");

    config.resolve = config.resolve ?? {};
    const existing = config.resolve.alias;
    const asArray = Array.isArray(existing)
      ? existing
      : Object.entries(existing ?? {}).map(([find, replacement]) => ({
          find,
          replacement: replacement as string,
        }));

    config.resolve.alias = [
      { find: /^@\/lib\/supabase\/(client|server|admin)$/, replacement: shim },
      // Server actions that reach the DB stack — stubbed so components that
      // import them can render in the browser (they can't run in Storybook).
      { find: /^@\/app\/(search|ingredients|routines|review)\/actions$/, replacement: actionStub },
      ...asArray,
    ];

    // Belt-and-suspenders: force the app's own Supabase kill switch on.
    config.define = {
      ...(config.define ?? {}),
      "process.env.NEXT_PUBLIC_SUPABASE_DISABLED": JSON.stringify("true"),
    };

    // Pre-bundle the MSW deps so the vitest browser project (Phase 6) doesn't
    // re-optimize them mid-run and reload the test worker.
    config.optimizeDeps = config.optimizeDeps ?? {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include ?? []),
      "msw",
      "msw/browser",
      "msw-storybook-addon/csf3",
    ];

    return config;
  },
};
export default config;
