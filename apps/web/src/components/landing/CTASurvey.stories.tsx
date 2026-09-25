import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CTASurvey } from "./CTASurvey";

const meta: Meta<typeof CTASurvey> = {
  title: "Landing/CTASurvey",
  component: CTASurvey,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof CTASurvey>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
