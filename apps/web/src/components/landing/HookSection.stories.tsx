import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HookSection } from "./HookSection";

const meta: Meta<typeof HookSection> = {
  title: "Landing/HookSection",
  component: HookSection,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof HookSection>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
