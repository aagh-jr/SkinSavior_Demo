import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteNav } from "./SiteNav";

/**
 * The wired nav (useSession + SiteNavView). The mocked Supabase session has no
 * user, so this renders the signed-out state. For signed-in/loading states,
 * see Nav/SiteNavView, which takes session props directly.
 */
const meta: Meta<typeof SiteNav> = {
  title: "Nav/SiteNav",
  component: SiteNav,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof SiteNav>;

export const SignedOut: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
