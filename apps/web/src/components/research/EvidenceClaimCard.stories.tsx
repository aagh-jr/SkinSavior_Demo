import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceClaimCard } from "./EvidenceClaimCard";
import {
  strongClaim,
  limitedClaim,
  veryLimitedClaim,
  longExplainerClaim,
} from "@/fixtures/claims.fixtures";

const meta: Meta<typeof EvidenceClaimCard> = {
  title: "Research/EvidenceClaimCard",
  component: EvidenceClaimCard,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[560px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof EvidenceClaimCard>;

export const Strong: Story = { args: { claim: strongClaim } };

export const Limited: Story = { args: { claim: limitedClaim } };

export const VeryLimited: Story = { args: { claim: veryLimitedClaim } };

/** With the ingredient name shown (used on ingredient pages). */
export const WithIngredient: Story = {
  args: { claim: strongClaim, showIngredient: true },
};

/** Long LLM explainer — checks card overflow. */
export const LongExplainer: Story = { args: { claim: longExplainerClaim } };

export const Mobile: Story = {
  args: { claim: strongClaim },
  globals: { viewport: { value: "iphoneSE" } },
};
