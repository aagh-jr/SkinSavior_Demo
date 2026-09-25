import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductProfileSplit } from "./ProductProfileSplit";
import { ProductThumb } from "@/components/ProductThumb";
import { niacinamideSerum, PLACEHOLDER_IMAGE } from "@/fixtures/products.fixtures";

const meta: Meta<typeof ProductProfileSplit> = {
  title: "Products/ProductProfileSplit",
  component: ProductProfileSplit,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ProductProfileSplit>;

const imageSlot = (
  <ProductThumb
    category={niacinamideSerum.category}
    imageUrl={PLACEHOLDER_IMAGE}
    name={niacinamideSerum.name}
    className="h-[320px] w-full rounded-[18px] border border-border"
  />
);

const summarySlot = (
  <div>
    <p className="font-mono text-[11px] uppercase tracking-wider text-link">
      {niacinamideSerum.brand}
    </p>
    <h1 className="mt-2 font-serif text-3xl text-ink">{niacinamideSerum.name}</h1>
    <p className="mt-3 text-[15px] text-muted-foreground">{niacinamideSerum.tagline}</p>
  </div>
);

export const Default: Story = {
  args: {
    imageSlot,
    summarySlot,
    ingredients: niacinamideSerum.ingredients,
    // Ingredients that have a research drill-in (lowercased names).
    researchLabels: new Set(["niacinamide", "zinc pca"]),
  },
};

/** No ingredient has research → no research affordance on any ingredient. */
export const NoResearchLabels: Story = {
  args: {
    imageSlot,
    summarySlot,
    ingredients: niacinamideSerum.ingredients,
    researchLabels: new Set<string>(),
  },
};

export const Mobile: Story = {
  args: {
    imageSlot,
    summarySlot,
    ingredients: niacinamideSerum.ingredients,
    researchLabels: new Set(["niacinamide"]),
  },
  globals: { viewport: { value: "iphoneSE" } },
};
