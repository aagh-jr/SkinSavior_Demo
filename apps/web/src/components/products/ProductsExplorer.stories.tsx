import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductsExplorer } from "./ProductsExplorer";
import {
  productCategories,
  productsPage,
  emptyProductsPage,
} from "@/fixtures/products.fixtures";

/**
 * The catalogue browser. The initial view renders from `initialPage` with no
 * fetch; live search/filter runs a server action that Storybook can't execute,
 * so typing a query surfaces the "unavailable" state (expected here).
 */
const meta: Meta<typeof ProductsExplorer> = {
  title: "Products/ProductsExplorer",
  component: ProductsExplorer,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof ProductsExplorer>;

export const Default: Story = {
  args: { categories: productCategories, initialPage: productsPage, initialQ: "" },
};

export const EmptyCatalogue: Story = {
  args: { categories: productCategories, initialPage: emptyProductsPage, initialQ: "" },
};

export const Mobile: Story = {
  args: { categories: productCategories, initialPage: productsPage, initialQ: "" },
  globals: { viewport: { value: "iphoneSE" } },
};
