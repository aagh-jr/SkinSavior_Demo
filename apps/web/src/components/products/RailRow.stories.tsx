import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RailRow } from "./RailRow";

const meta: Meta<typeof RailRow> = {
  title: "Products/RailRow",
  component: RailRow,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[240px]"><Story /></div>],
  args: { label: "Serums", hint: "4", active: false, onClick: () => {} },
};
export default meta;

type Story = StoryObj<typeof RailRow>;

export const Default: Story = {};

export const Active: Story = { args: { active: true } };

export const NoHint: Story = { args: { hint: undefined } };
