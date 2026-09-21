import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IngredientsExplorer } from "./IngredientsExplorer";
import { ingredientsPage, emptyIngredientsPage } from "@/fixtures/ingredients.fixtures";

/**
 * Ingredient catalogue browser. The initial view renders from `initialPage`;
 * live search runs a server action Storybook can't execute (stubbed), so typing
 * a query surfaces the unavailable/empty state.
 */
const meta: Meta<typeof IngredientsExplorer> = {
  title: "Ingredients/IngredientsExplorer",
  component: IngredientsExplorer,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof IngredientsExplorer>;

export const Default: Story = {
  args: { initialPage: ingredientsPage, initialQ: "" },
};

export const Empty: Story = {
  args: { initialPage: emptyIngredientsPage, initialQ: "" },
};

export const Mobile: Story = {
  args: { initialPage: ingredientsPage, initialQ: "" },
  globals: { viewport: { value: "iphoneSE" } },
};
