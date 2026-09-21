import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GridCard } from "./GridCard";
import { productCardRows } from "@/fixtures/products.fixtures";

const bySlug = (slug: string) => productCardRows.find((r) => r.slug === slug)!;

const meta: Meta<typeof GridCard> = {
  title: "Products/GridCard",
  component: GridCard,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[260px]"><Story /></div>],
  args: { p: bySlug("skinceuticals-ce-ferulic") },
};
export default meta;

type Story = StoryObj<typeof GridCard>;

export const Default: Story = {};

/** No photo → category icon fallback. */
export const NoPhoto: Story = { args: { p: bySlug("generic-hyaluronic-serum") } };

export const LongText: Story = { args: { p: bySlug("brand-extremely-long-name") } };

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
