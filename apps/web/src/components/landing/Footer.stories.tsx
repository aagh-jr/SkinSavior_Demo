import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Footer } from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Landing/Footer",
  component: Footer,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
