import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { http, HttpResponse } from "msw";
import { SiteNavView } from "@/components/SiteNavView";
import { EvidenceExplainer } from "@/components/research/EvidenceExplainer";
import { IngredientResearch } from "@/components/research/IngredientResearch";
import { signedInSession } from "@/fixtures/user.fixtures";
import { niacinamide } from "@/fixtures/ingredients.fixtures";
import { claims } from "@/fixtures/claims.fixtures";
import { researchOk } from "@/fixtures/research.fixtures";

/**
 * Ingredient detail screen: description, graded claims, and PubMed research.
 * Assembled from visual components + fixtures.
 */
const meta: Meta = {
  title: "Pages/IngredientDetail",
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

function IngredientScreen() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavView {...signedInSession} />
      <main className="mx-auto w-full max-w-[820px] px-6 py-10 md:px-10">
        <p className="text-[13px] text-muted-foreground">Ingredients</p>
        <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-ink">
          {niacinamide.common_name}{" "}
          <span className="text-muted-foreground">({niacinamide.inci_name})</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-foreground/80">
          {niacinamide.description}
        </p>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink">What the evidence says</h2>
          <div className="mt-4">
            <EvidenceExplainer claims={claims} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-ink">The research</h2>
          <div className="mt-4">
            <IngredientResearch ingredientId="ing-niacinamide" />
          </div>
        </section>
      </main>
    </div>
  );
}

export const Default: Story = { render: () => <IngredientScreen /> };

export const Mobile: Story = {
  render: () => <IngredientScreen />,
  globals: { viewport: { value: "iphoneSE" } },
};
