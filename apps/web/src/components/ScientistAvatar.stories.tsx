import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScientistAvatar } from "./ScientistAvatar";

const meta: Meta<typeof ScientistAvatar> = {
  title: "Shared/ScientistAvatar",
  component: ScientistAvatar,
  parameters: { layout: "centered" },
  args: { talking: false, size: 64 },
};
export default meta;

type Story = StoryObj<typeof ScientistAvatar>;

/** Resting on the closed-mouth frame. */
export const Idle: Story = { args: { talking: false } };

/** Cycles between frames while the model is "working". */
export const Talking: Story = { args: { talking: true } };

export const Large: Story = { args: { talking: true, size: 120 } };
