import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoogleMark } from "./GoogleMark";

const meta: Meta<typeof GoogleMark> = {
  title: "Quiz/Brand marks/GoogleMark",
  component: GoogleMark,
  parameters: { layout: "centered" },
};
export default meta;

export const Default: StoryObj<typeof GoogleMark> = {
  render: () => (
    <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-ink">
      <GoogleMark /> Continue with Google
    </span>
  ),
};
