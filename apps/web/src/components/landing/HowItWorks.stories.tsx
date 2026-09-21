import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HowItWorks } from "./HowItWorks";

const meta: Meta<typeof HowItWorks> = {
  title: "Landing/HowItWorks",
  component: HowItWorks,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof HowItWorks>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
