import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductProfileSplit } from "./ProductProfileSplit";
import { niacinamideSerum } from "@/fixtures/products.fixtures";

const meta: Meta<typeof ProductProfileSplit> = {
  title: "Products/ProductProfileSplit",
  component: ProductProfileSplit,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof ProductProfileSplit>;

export const Default: Story = {
  args: {
    ingredients: niacinamideSerum.ingredients,
    researchLabels: new Set(["niacinamide", "zinc pca"]),
    evidenceSlot: (
      <section>
        <h2 className="font-mono text-sm font-bold uppercase">Evidence by claim</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 rounded-xl border border-soft-tan bg-[#fafbfc]" />
          ))}
        </div>
      </section>
    ),
    researchSlot: (
      <section>
        <h2 className="font-mono text-sm font-bold uppercase">The research</h2>
        <div className="mt-4 h-48 rounded-xl border border-soft-tan" />
      </section>
    ),
  },
};

/** No ingredient has research → no research affordance on any ingredient. */
export const NoResearchLabels: Story = {
  args: {
    ingredients: niacinamideSerum.ingredients,
    researchLabels: new Set<string>(),
  },
};

export const Mobile: Story = {
  args: {
    ingredients: niacinamideSerum.ingredients,
    researchLabels: new Set(["niacinamide"]),
  },
  globals: { viewport: { value: "iphoneSE" } },
};

export const Empty: Story = {
  args: {
    ingredients: [],
    researchLabels: new Set<string>(),
  },
};
