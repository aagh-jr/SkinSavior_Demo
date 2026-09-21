import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListCard } from "./ListCard";
import { productCardRows } from "@/fixtures/products.fixtures";

const bySlug = (slug: string) => productCardRows.find((r) => r.slug === slug)!;

const meta: Meta<typeof ListCard> = {
  title: "Products/ListCard",
  component: ListCard,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="max-w-[520px]"><Story /></div>],
  args: { p: bySlug("cerave-hydrating-cleanser") },
};
export default meta;

type Story = StoryObj<typeof ListCard>;

export const Default: Story = {};

export const NoPhoto: Story = { args: { p: bySlug("generic-hyaluronic-serum") } };

export const LongText: Story = { args: { p: bySlug("brand-extremely-long-name") } };

export const Mobile: Story = { globals: { viewport: { value: "iphoneSE" } } };
