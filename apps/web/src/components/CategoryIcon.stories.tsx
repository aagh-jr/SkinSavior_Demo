import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryIcon } from "./CategoryIcon";

const meta: Meta<typeof CategoryIcon> = {
  title: "Shared/CategoryIcon",
  component: CategoryIcon,
  parameters: { layout: "centered" },
  args: { category: "serum", size: 40 },
};
export default meta;

type Story = StoryObj<typeof CategoryIcon>;

export const Default: Story = {};

const CATEGORIES = [
  "oil_cleanser",
  "cleanser",
  "exfoliant",
  "mask",
  "toner",
  "essence",
  "serum",
  "eye_cream",
  "spot_treatment",
  "moisturizer",
  "face_oil",
  "lip_balm",
  "sunscreen",
  "other",
] as const;

/** Every category glyph in the set. */
export const AllCategories: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6 text-ink sm:grid-cols-7">
      {CATEGORIES.map((c) => (
        <div key={c} className="flex flex-col items-center gap-2 text-center">
          <CategoryIcon category={c} size={36} />
          <span className="text-[11px] text-muted-foreground">{c}</span>
        </div>
      ))}
    </div>
  ),
};

/** Unknown category falls back to the "other" glyph. */
export const UnknownFallback: Story = {
  args: { category: "not-a-real-category", size: 40 },
};
