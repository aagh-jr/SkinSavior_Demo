import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReviewQueue } from "./ReviewQueue";
import { pendingStudies } from "@/fixtures/research.fixtures";

/**
 * The /review moderation queue. Approve/reject call server actions Storybook
 * doesn't run — these cover the render states.
 */
const meta: Meta<typeof ReviewQueue> = {
  title: "Research/ReviewQueue",
  component: ReviewQueue,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[720px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ReviewQueue>;

/** Pending studies, incl. one that would flip a grade and one sponsored. */
export const Default: Story = { args: { studies: pendingStudies } };

/** Nothing pending. */
export const Empty: Story = { args: { studies: [] } };

export const Mobile: Story = {
  args: { studies: pendingStudies },
  globals: { viewport: { value: "iphoneSE" } },
};
