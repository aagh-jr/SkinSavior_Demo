import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ClaimBadgeIcon } from "./ClaimBadgeIcon";
import { CLAIM_BADGE_SLUGS, CLAIM_BADGES } from "@skinsavior/core/research";

const meta: Meta<typeof ClaimBadgeIcon> = {
  title: "Research/ClaimBadgeIcon",
  component: ClaimBadgeIcon,
  parameters: { layout: "centered" },
  args: { slug: "evens-tone", className: "h-6 w-6 text-link" },
};
export default meta;

type Story = StoryObj<typeof ClaimBadgeIcon>;

export const Default: Story = {};

/** Every badge in the claim vocabulary. */
export const AllBadges: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-5 text-ink sm:grid-cols-5">
      {CLAIM_BADGE_SLUGS.map((slug) => (
        <div key={slug} className="flex flex-col items-center gap-2 text-center">
          <ClaimBadgeIcon slug={slug} className="h-6 w-6 text-link" />
          <span className="text-[11px] text-muted-foreground">{CLAIM_BADGES[slug].label}</span>
        </div>
      ))}
    </div>
  ),
};
