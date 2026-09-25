import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ViewButton } from "./ViewButton";

const meta: Meta<typeof ViewButton> = {
  title: "Products/ViewButton",
  component: ViewButton,
  parameters: { layout: "centered" },
  args: { active: true, label: "Grid view", onClick: () => {} },
};
export default meta;

type Story = StoryObj<typeof ViewButton>;

const gridGlyph = (
  <>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </>
);

const listGlyph = (
  <>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </>
);

export const GridActive: Story = { args: { active: true, label: "Grid view", children: gridGlyph } };

export const ListInactive: Story = { args: { active: false, label: "List view", children: listGlyph } };

/** The pair as rendered together in the toolbar. */
export const Toggle: Story = {
  render: () => (
    <div className="flex gap-1 rounded-lg border border-soft-tan p-1">
      <ViewButton active label="Grid view" onClick={() => {}}>{gridGlyph}</ViewButton>
      <ViewButton active={false} label="List view" onClick={() => {}}>{listGlyph}</ViewButton>
    </div>
  ),
};
