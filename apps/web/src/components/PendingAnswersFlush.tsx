"use client";

import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuthEvents } from "@/hooks/useAuthEvents";
import { flushPendingAnswers, readPendingAnswers } from "@/lib/quiz-answers";

// Saves stashed quiz answers on the first authenticated moment anywhere in
// the app — typically after the email-confirmation link lands on the home
// page. The quiz page runs its own flow, so we stay out of its way there.
export function PendingAnswersFlush() {
  const pathname = usePathname();
  const onQuiz = pathname?.startsWith("/quiz") ?? false;

  useAuthEvents((event, session) => {
    if (
      (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
      session &&
      readPendingAnswers()
    ) {
      void flushPendingAnswers().then((ok) => {
        if (ok) toast.success("Your skin profile is saved.");
      });
    }
  }, !onQuiz);

  return null;
}
