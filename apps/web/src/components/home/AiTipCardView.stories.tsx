import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AiTipCardView } from "./AiTipCardView";

const meta: Meta<typeof AiTipCardView> = {
  title: "Home/AiTipCardView",
  component: AiTipCardView,
  parameters: { layout: "padded" },
  args: {
    status: "ok",
    tip: "Your retinoid and BHA are both on PM slots — try alternating nights so you're not layering two strong actives at once.",
    error: "",
    onRefresh: () => {},
  },
  decorators: [
    (Story) => (
      <div className="max-w-[420px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AiTipCardView>;

export const Default: Story = {};

export const Loading: Story = { args: { status: "loading", tip: "" } };

export const Error: Story = {
  args: { status: "error", error: "Couldn't reach the AI right now.", tip: "" },
};

export const LongText: Story = {
  args: {
    tip: "A gentle reminder: you're doing the important things already — a daily sunscreen and a simple, consistent routine beat any single 'miracle' active. If you want to add something next, a well-formulated niacinamide serum is a low-risk place to start, and it layers comfortably under everything else you're using right now.",
  },
};

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
