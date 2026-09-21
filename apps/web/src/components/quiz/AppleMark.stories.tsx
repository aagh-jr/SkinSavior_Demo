import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppleMark } from "./AppleMark";

const meta: Meta<typeof AppleMark> = {
  title: "Quiz/Brand marks/AppleMark",
  component: AppleMark,
  parameters: { layout: "centered" },
};
export default meta;

export const Default: StoryObj<typeof AppleMark> = {
  render: () => (
    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-ink">
      <AppleMark /> Continue with Apple
    </span>
  ),
};
