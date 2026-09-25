import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { QuestionView } from "./QuestionView";
import type { Step } from "./survey.types";

const singleStep: Step = {
  key: "skin_type",
  kind: "single",
  title: "What kind of skin do you have?",
  sub: "Pick the one that fits most days.",
  choices: [
    { value: "dry", label: "Dry (tight or flaky)" },
    { value: "normal", label: "Normal (comfortable, balanced)" },
    { value: "combination", label: "Combo (oily T-zone, drier cheeks)" },
    { value: "oily", label: "Oily (shiny all over)" },
  ],
};

const multiStep: Step = {
  key: "reactions",
  kind: "multi",
  title: "Have any of these caused a reaction before?",
  sub: "Select up to 3.",
  max: 3,
  choices: [
    { value: "fragrance", label: "Fragrance" },
    { value: "essential_oils", label: "Essential oils" },
    { value: "retinoids", label: "Retinoids" },
    { value: "aha_bha", label: "AHAs / BHAs" },
    { value: "none", label: "None that I know of" },
  ],
};

const meta: Meta<typeof QuestionView> = {
  title: "Quiz/QuestionView",
  component: QuestionView,
  parameters: { layout: "padded" },
  decorators: [(Story) => <div className="mx-auto max-w-[640px]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof QuestionView>;

/** Interactive single-select step. */
export const SingleSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string | string[]>();
    return (
      <QuestionView
        step={singleStep}
        value={value}
        onChange={setValue}
        onNext={() => {}}
        onBack={() => {}}
        canBack={false}
        canContinue={Boolean(value)}
        isLast={false}
        onSkip={() => {}}
      />
    );
  },
};

/** Multi-select with a max of 3 and a Back button. */
export const MultiSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string | string[]>([]);
    return (
      <QuestionView
        step={multiStep}
        value={value}
        onChange={setValue}
        onNext={() => {}}
        onBack={() => {}}
        canBack
        canContinue={Array.isArray(value) && value.length > 0}
        isLast
        onSkip={() => {}}
      />
    );
  },
};

export const Mobile: Story = {
  ...SingleSelect,
  globals: { viewport: { value: "iphoneSE" } },
};
