import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse } from "msw";
import { SiteNavView } from "@/components/SiteNavView";
import { ProductThumb } from "@/components/ProductThumb";
import { ProductProfileSplit } from "@/components/products/ProductProfileSplit";
import { EvidenceByClaim } from "@/components/products/EvidenceByClaim";
import { SaveButton } from "@/components/products/SaveButton";
import { ResearchDropdown } from "@/components/research/ResearchDropdown";
import { signedInSession } from "@/fixtures/user.fixtures";
import { niacinamideSerum, PLACEHOLDER_IMAGE } from "@/fixtures/products.fixtures";
import { claims } from "@/fixtures/claims.fixtures";
import { researchOk } from "@/fixtures/research.fixtures";

/**
 * Product detail screen with the evidence breakdown, assembled from visual
 * components + fixtures.
 */
const meta: Meta = {
  title: "Pages/ProductDetail",
  parameters: {
    layout: "fullscreen",
    msw: {
      handlers: [
        http.get("*/api/ingredients/*/research", () => HttpResponse.json(researchOk)),
      ],
    },
  },
};
export default meta;

type Story = StoryObj;

const p = niacinamideSerum;

function ProductScreen() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavView {...signedInSession} />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-10 md:px-10">
        <p className="text-[13px] text-muted-foreground">Products · {p.category}</p>

        <div className="mt-4 grid items-center gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
          <ProductThumb
            category={p.category}
            imageUrl={PLACEHOLDER_IMAGE}
            name={p.name}
            className="h-[300px] w-full rounded-[18px] border border-border"
          />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-link">{p.brand}</p>
            <h1 className="mt-2 font-serif text-3xl text-ink">{p.name}</h1>
            <p className="mt-3 text-[15px] text-muted-foreground">{p.tagline}</p>
            <div className="mt-4">
              <SaveButton productId="prod-niacinamide" initialSaved={false} signedIn />
            </div>
          </div>
        </div>

        <div className="mt-12">
          <ProductProfileSplit
            ingredients={p.ingredients}
            researchLabels={new Set(["niacinamide", "zinc pca"])}
          />
        </div>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-ink">Evidence by claim</h2>
          <div className="mt-4">
            <EvidenceByClaim claims={claims} />
          </div>
        </section>

        <ResearchDropdown
          ingredients={[{ ingredientId: "ing-niacinamide", label: "Niacinamide" }]}
        />
      </main>
    </div>
  );
}

export const Default: Story = { render: () => <ProductScreen /> };

export const Mobile: Story = {
  render: () => <ProductScreen />,
  globals: { viewport: { value: "iphoneSE" } },
};
