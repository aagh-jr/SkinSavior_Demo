import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ForYouEmptyState } from "./ForYouEmptyState";

/**
 * Renders the SiteNav internally (signed-out via the mocked session). Shown on
 * /for-you when the viewer has no scorable profile yet.
 */
const meta: Meta<typeof ForYouEmptyState> = {
  title: "ForYou/ForYouEmptyState",
  component: ForYouEmptyState,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ForYouEmptyState>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
