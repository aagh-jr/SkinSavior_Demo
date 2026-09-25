import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceExplainer } from "./EvidenceExplainer";
import { claims } from "@/fixtures/claims.fixtures";

const meta: Meta<typeof EvidenceExplainer> = {
  title: "Research/EvidenceExplainer",
  component: EvidenceExplainer,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[640px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof EvidenceExplainer>;

/** All claims, strongest-first. */
export const Default: Story = { args: { claims } };

export const WithIngredientNames: Story = {
  args: { claims, showIngredient: true },
};

export const Empty: Story = { args: { claims: [] } };

export const Mobile: Story = {
  args: { claims },
  globals: { viewport: { value: "iphoneSE" } },
};
