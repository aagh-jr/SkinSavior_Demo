import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { QuestionView } from "@/components/quiz/QuestionView";
import { DoneView } from "@/components/quiz/DoneView";
import type { Step } from "@/components/quiz/survey.types";

/**
 * Quiz flow screens, assembled from QuestionView + DoneView + fixtures. Shows
 * the first question, a middle question, and the final "saved" step.
 */
const meta: Meta = {
  title: "Pages/Quiz",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

const firstStep: Step = {
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

const middleStep: Step = {
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

function QuizShell({
  step,
  progress,
  canBack,
}: {
  step: Step;
  progress: number;
  canBack: boolean;
}) {
  const [value, setValue] = useState<string | string[]>(step.kind === "multi" ? [] : "");
  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <main className="mx-auto w-full max-w-[640px] px-6 py-14">
        <QuestionView
          step={step}
          value={value}
          onChange={setValue}
          onNext={() => {}}
          onBack={() => {}}
          canBack={canBack}
          canContinue={Array.isArray(value) ? value.length > 0 : Boolean(value)}
          isLast={false}
          onSkip={() => {}}
        />
      </main>
    </div>
  );
}

/** First question. */
export const FirstQuestion: Story = {
  render: () => <QuizShell step={firstStep} progress={10} canBack={false} />,
};

/** A middle question (multi-select). */
export const MiddleQuestion: Story = {
  render: () => <QuizShell step={middleStep} progress={55} canBack />,
};

/** Final step — answers saved. */
export const Done: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full bg-primary" />
      <main className="mx-auto w-full max-w-[560px] px-6 py-20">
        <DoneView isRetake={false} />
      </main>
    </div>
  ),
};

export const Mobile: Story = {
  render: () => <QuizShell step={firstStep} progress={10} canBack={false} />,
  globals: { viewport: { value: "iphoneSE" } },
};
