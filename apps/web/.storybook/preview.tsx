import type { Preview } from "@storybook/nextjs-vite";
import { Newsreader, Hanken_Grotesk, Space_Grotesk } from "next/font/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@skinsavior/core/query";
import { mswLoader } from "msw-storybook-addon/csf3";
import { http, HttpResponse } from "msw";

// Tailwind + theme tokens. Everything visual in the app hangs off these.
import "../src/app/globals.css";

// mswLoader() (CSF3) starts the MSW worker (public/mockServiceWorker.js) and
// applies each story's parameters.msw.handlers. Asset/Storybook requests are
// bypassed by the addon; /api is caught by the default handler below.

// Default catch-all: any /api/* request a story forgot to mock fails loudly
// with a 501 instead of silently reaching the real backend. Stories that need
// data override parameters.msw.handlers with their own success/error handlers.
const unhandledApi = http.all("*/api/*", ({ request }) =>
  HttpResponse.json(
    {
      error:
        "Unhandled /api request in Storybook. Add an MSW handler to this story's parameters.msw.handlers.",
      url: request.url,
    },
    { status: 501 },
  ),
);

// Match the three families layout.tsx loads, and expose the same CSS
// variables (--font-newsreader / --font-hanken / --font-space-grotesk) that
// globals.css maps onto --font-serif / --font-sans / --font-mono.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const fontVars = `${newsreader.variable} ${hanken.variable} ${spaceGrotesk.variable}`;

// One QueryClient for the whole Storybook session, mirroring providers.tsx.
const queryClient = makeQueryClient();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    msw: {
      handlers: [unhandledApi],
    },
    // Render components as they run under the App Router (next/navigation,
    // next/link, next/image all resolve against a mocked app router).
    nextjs: {
      appDirectory: true,
    },
    // Default canvas = the app surface. globals.css :root sets the real values;
    // these mirror them so the toolbar swatches match what the app renders.
    backgrounds: {
      options: {
        cream: { name: "Cream (app surface)", value: "#F5F7FA" },
        white: { name: "White (card)", value: "#FFFFFF" },
        ink: { name: "Ink (dark)", value: "#12181F" },
      },
    },
    viewport: {
      options: {
        iphoneSE: { name: "iPhone SE (375px)", styles: { width: "375px", height: "667px" } },
        iphone12: { name: "iPhone 12/13/14 (390px)", styles: { width: "390px", height: "844px" } },
        desktop: { name: "Desktop (1280px)", styles: { width: "1280px", height: "800px" } },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "cream" },
  },
  loaders: [mswLoader()],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className={`${fontVars} font-sans text-foreground`}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
