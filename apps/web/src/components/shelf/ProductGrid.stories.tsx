import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductGrid } from "./ProductGrid";
import { shelfProducts, savedOnlyShelfProducts } from "@/fixtures/products.fixtures";

const meta: Meta<typeof ProductGrid> = {
  title: "Shelf/ProductGrid",
  component: ProductGrid,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ProductGrid>;

export const Default: Story = { args: { products: shelfProducts } };

/** Saved-only rows (no "in <routine>" line). */
export const SavedOnly: Story = { args: { products: savedOnlyShelfProducts } };

export const Empty: Story = { args: { products: [] } };

export const Mobile: Story = {
  args: { products: shelfProducts },
  globals: { viewport: { value: "iphoneSE" } },
};
