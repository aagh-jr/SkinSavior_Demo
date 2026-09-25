import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceMeter } from "./EvidenceMeter";

const meta: Meta<typeof EvidenceMeter> = {
  title: "Research/EvidenceMeter",
  component: EvidenceMeter,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof EvidenceMeter>;

export const Strong: Story = {
  args: { certainty: "strong", notches: 4, label: "Strong evidence" },
};
export const Moderate: Story = {
  args: { certainty: "moderate", notches: 3, label: "Moderate evidence" },
};
export const Limited: Story = {
  args: { certainty: "limited", notches: 2, label: "Limited evidence" },
};
export const VeryLimited: Story = {
  args: { certainty: "very_limited", notches: 1, label: "Very limited evidence" },
};

/** All four tiers stacked. */
export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <EvidenceMeter certainty="strong" notches={4} label="Strong evidence" />
      <EvidenceMeter certainty="moderate" notches={3} label="Moderate evidence" />
      <EvidenceMeter certainty="limited" notches={2} label="Limited evidence" />
      <EvidenceMeter certainty="very_limited" notches={1} label="Very limited evidence" />
    </div>
  ),
};
