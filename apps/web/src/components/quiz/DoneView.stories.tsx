import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DoneView } from "./DoneView";

const meta: Meta<typeof DoneView> = {
  title: "Quiz/DoneView",
  component: DoneView,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="mx-auto max-w-[560px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DoneView>;

/** First-time completion — points to the routine builder. */
export const FirstTime: Story = { args: { isRetake: false } };

/** Retake from settings — scores updated. */
export const Retake: Story = { args: { isRetake: true } };
