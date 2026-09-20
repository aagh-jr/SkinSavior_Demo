import type { QuizAnswers } from "@/lib/quiz-answers";

/** One selectable answer in a quiz step. */
export type Choice = { value: string; label: string; hint?: string };

/** One quiz step: a single-select or multi-select question over an answer key. */
export type Step =
  | { key: keyof QuizAnswers; kind: "single"; title: string; sub?: string; choices: Choice[] }
  | {
      key: keyof QuizAnswers;
      kind: "multi";
      title: string;
      sub?: string;
      choices: Choice[];
      max?: number;
    };
