import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeroCard } from "./HeroCard";

const meta: Meta<typeof HeroCard> = {
  title: "Landing/HeroCard",
  component: HeroCard,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof HeroCard>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
