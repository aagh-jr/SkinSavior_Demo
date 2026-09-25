import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EvidenceByClaim } from "./EvidenceByClaim";
import { claims, strongClaim, veryLimitedClaim } from "@/fixtures/claims.fixtures";

const meta: Meta<typeof EvidenceByClaim> = {
  title: "Products/EvidenceByClaim",
  component: EvidenceByClaim,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-[1100px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof EvidenceByClaim>;

/** Card layout across the certainty tiers. */
export const AllTiers: Story = { args: { claims } };

export const SingleStrong: Story = { args: { claims: [strongClaim] } };

export const SingleVeryLimited: Story = { args: { claims: [veryLimitedClaim] } };

/** An explicit card explains when no graded evidence is available. */
export const Empty: Story = { args: { claims: [] } };

export const Mobile: Story = {
  args: { claims },
  globals: { viewport: { value: "iphoneSE" } },
};
