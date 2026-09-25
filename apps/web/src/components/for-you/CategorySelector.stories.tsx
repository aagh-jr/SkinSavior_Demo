import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategorySelector } from "./CategorySelector";

const categories = [
  { key: "all", label: "All" },
  { key: "cleanser", label: "Cleansers" },
  { key: "serum", label: "Serums" },
  { key: "moisturizer", label: "Moisturizers" },
  { key: "sunscreen", label: "Sunscreens" },
  { key: "toner", label: "Toners" },
];

const meta: Meta<typeof CategorySelector> = {
  title: "ForYou/CategorySelector",
  component: CategorySelector,
  parameters: { layout: "padded" },
  args: { categories, active: "serum" },
};
export default meta;

type Story = StoryObj<typeof CategorySelector>;

export const Default: Story = {};

export const AllActive: Story = { args: { active: "all" } };

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
