"use client";

import { Suspense, useCallback, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { seedRoutineFromQuizAction } from "@/app/routines/actions";
import {
  clearPendingAnswers,
  persistAnswers,
  stashPendingAnswers,
  type QuizAnswers,
} from "@/lib/quiz-answers";
import { QuestionView } from "@/components/quiz/QuestionView";
import { DoneView } from "@/components/quiz/DoneView";
import { GoogleMark } from "@/components/quiz/GoogleMark";
import { AppleMark } from "@/components/quiz/AppleMark";
import type { Step } from "@/components/quiz/survey.types";

// ---------- survey definition ----------
type Answers = QuizAnswers;

// Survey design note: the first four questions score the four independent
// axes of the Baumann Skin Type Indicator (oily/dry, sensitive/resistant,
// pigmented/non-pigmented, wrinkle-prone/tight) instead of collapsing skin
// into one self-labeled bucket. Sun reaction is a simplified Fitzpatrick
// phototype proxy (burn/tan behavior, not just how much sun someone gets).
// Medications and pregnancy status follow standard dermatology-intake
// practice for ingredient-safety flags (retinoids, isotretinoin, salicylic
// acid) and are explicitly skippable — "prefer not to say" is always a
// valid answer so no one is forced to disclose health information.
const STEPS: Step[] = [
  {
    key: "skin_type",
    kind: "single",
    title: "What kind of skin do you have?",
    choices: [
      { value: "dry", label: "Dry (tight or flaky)" },
      { value: "normal", label: "Normal (comfortable, balanced)" },
      { value: "combination", label: "Combo (oily T-zone, drier cheeks)" },
      { value: "oily", label: "Oily (shiny all over)" },
    ],
  },
  {
    key: "pigmentation",
    kind: "single",
    title: "Do you deal with dark spots or uneven tone?",
    choices: [
      { value: "none", label: "No — my tone is pretty even" },
      { value: "occasional_marks", label: "Occasional marks that fade after a breakout" },
      { value: "persistent_spots", label: "Persistent dark spots, sun spots, or melasma" },
    ],
  },
  {
    key: "aging_concern",
    kind: "single",
    title: "How would you describe fine lines & firmness?",
    choices: [
      { value: "smooth", label: "Smooth and tight, no real concerns" },
      { value: "fine_lines", label: "A few fine lines starting to show" },
      { value: "visible_wrinkles", label: "Visible wrinkles or loss of firmness" },
    ],
  },
  {
    key: "sensitivity",
    kind: "single",
    title: "When you try a new skincare product, what usually happens?",
    choices: [
      { value: "low", label: "Nothing — I can use almost anything" },
      { value: "medium", label: "Occasional redness, stinging, or breakouts" },
      { value: "high", label: "I react to most new products (redness, burning, itching)" },
    ],
  },
  {
    key: "sun_reaction",
    kind: "single",
    title: "What happens when your skin gets unprotected sun?",
    sub: "Helps calibrate SPF & active-ingredient recommendations",
    choices: [
      { value: "always_burns", label: "Always burns, rarely or never tans" },
      { value: "burns_then_tans", label: "Burns first, then tans" },
      { value: "tans_easily", label: "Tans easily, rarely burns" },
      { value: "never_burns", label: "Never burns, tans deeply" },
    ],
  },
  {
    key: "sun_exposure",
    kind: "single",
    title: "How much sun does your skin actually see day to day?",
    choices: [
      { value: "low", label: "Mostly indoors" },
      { value: "medium", label: "Daily walks & windows" },
      { value: "high", label: "Outdoors most days" },
    ],
  },
  {
    key: "age_range",
    kind: "single",
    title: "What's your age range?",
    choices: [
      { value: "under_18", label: "Under 18" },
      { value: "18_24", label: "18 – 24" },
      { value: "25_34", label: "25 – 34" },
      { value: "35_44", label: "35 – 44" },
      { value: "45_54", label: "45 – 54" },
      { value: "55_plus", label: "55+" },
    ],
  },
  {
    key: "current_routine",
    kind: "multi",
    title: "What's already in your routine?",
    sub: "Pick all that apply — helps us avoid recommending things you already use.",
    choices: [
      { value: "cleanser", label: "Cleanser" },
      { value: "toner", label: "Toner" },
      { value: "serum", label: "Serum" },
      { value: "moisturizer", label: "Moisturizer" },
      { value: "spf", label: "Sunscreen" },
      { value: "retinoid", label: "Retinol / retinoid" },
      { value: "exfoliant", label: "Exfoliant (AHA/BHA)" },
      { value: "none", label: "Nothing yet — starting fresh" },
    ],
  },
  {
    key: "reactions",
    kind: "multi",
    title: "Any ingredient you've reacted to before?",
    sub: "Pick all that apply.",
    choices: [
      { value: "fragrance", label: "Fragrance" },
      { value: "alcohol", label: "Drying alcohols" },
      { value: "actives", label: "Retinoids or acids" },
      { value: "essential_oils", label: "Essential oils" },
      { value: "none", label: "Nothing I know of" },
    ],
  },
  {
    key: "medications",
    kind: "multi",
    title: "Are you currently using any prescription skin treatments?",
    sub: "These interact with common actives — helps us flag real clashes, not guesses. Pick all that apply.",
    choices: [
      { value: "retinoid_rx", label: "Prescription retinoid (tretinoin, adapalene, etc.)" },
      { value: "isotretinoin", label: "Isotretinoin (Accutane), currently or in the last 6 months" },
      { value: "other_topical_rx", label: "Other prescription topical" },
      { value: "none", label: "None of these" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    key: "pregnancy_status",
    kind: "single",
    title: "Are you currently pregnant or breastfeeding?",
    sub: "Some actives (retinoids, high-dose salicylic acid) carry specific guidance here — this only affects your safety flags.",
    choices: [
      { value: "pregnant_or_breastfeeding", label: "Yes" },
      { value: "not_applicable", label: "No" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    key: "routine_complexity",
    kind: "single",
    title: "How long do you want your routine to be?",
    choices: [
      { value: "minimal", label: "Three steps, tops" },
      { value: "balanced", label: "A solid 5–6 step routine" },
      { value: "enthusiast", label: "Bring on the layers" },
    ],
  },
  {
    key: "budget",
    kind: "multi",
    title: "What's your usual price range per product?",
    sub: "Pick all that apply.",
    choices: [
      { value: "drugstore", label: "Under $20" },
      { value: "mid", label: "$20 – $50" },
      { value: "prestige", label: "$50 – $100" },
      { value: "luxury", label: "$100+" },
    ],
  },
];

const TOTAL = STEPS.length;

// ---------- main component ----------
export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizInner />
    </Suspense>
  );
}

function QuizInner() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<"survey" | "account" | "done">("survey");
  const router = useRouter();
  const searchParams = useSearchParams();
  // Settings' "Retake quiz" link carries this flag. A retake is someone who
  // already has a routine and just wants their match scores updated — it
  // should land them back where they started, not walk them into the
  // routine builder like a first-time signup.
  const isRetake = searchParams.get("retake") === "1";

  // Persist the answers and hand off. First-time signups seed the routine
  // and land in the builder; a retake already has a routine (seeding is a
  // no-op there anyway) and returns to Settings, which is where the retake
  // was launched from and where the updated "last taken" date shows up.
  const finish = useCallback(() => {
    setPhase("done");
    if (isRetake) {
      void new Promise((r) => setTimeout(r, 900)).then(() => {
        router.push("/settings");
      });
      return;
    }
    // Seed the routine and hold the confirmation for a beat — CONCURRENTLY.
    // Chaining a 1400ms timeout onto .then() made the two additive: the server
    // action takes ~3s, so the measured wait was 4.5s of staring at a static
    // "profile saved" screen. Racing them against Promise.all means the dwell
    // only costs anything when the action returns faster than it, which is the
    // point of having one at all.
    void Promise.all([
      seedRoutineFromQuizAction(),
      new Promise((r) => setTimeout(r, 900)),
    ]).then(([res]) => {
      router.push(res.ok ? `/routines/${res.id}` : "/home");
    }).catch(() => router.push("/home"));
  }, [router, isRetake]);

  const step = STEPS[stepIdx];
  const progress = phase === "survey" ? ((stepIdx + 1) / (TOTAL + 1)) * 100 : 100;

  function setAnswer(value: string | string[]) {
    setAnswers((a) => ({ ...a, [step.key]: value }));
  }

  function next() {
    if (stepIdx < TOTAL - 1) setStepIdx((i) => i + 1);
    else setPhase("account");
  }

  function back() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  const current = answers[step.key as keyof Answers];
  const canContinue =
    step.kind === "single"
      ? typeof current === "string" && current.length > 0
      : Array.isArray(current) && current.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-xl font-semibold tracking-tight text-ink"
          >
            skinsavior
          </Link>
          <span className="text-[13px] text-muted-foreground">
            {phase === "survey"
              ? `Question ${stepIdx + 1} of ${TOTAL}`
              : phase === "account"
                ? "Last step · create your account"
                : "All set"}
          </span>
        </div>
        <div className="h-[3px] bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-6 py-12 md:py-20">
        {phase === "survey" && (
          <QuestionView
            step={step}
            value={current}
            onChange={setAnswer}
            onNext={next}
            onBack={back}
            canBack={stepIdx > 0}
            canContinue={canContinue}
            isLast={stepIdx === TOTAL - 1}
            onSkip={stepIdx === 0 ? () => setPhase("account") : undefined}
          />
        )}
        {phase === "account" && (
          <AccountStep
            answers={answers}
            // Hand off into the routine builder rather than the home page.
            // The builder is seeded from the current_routine answer just
            // saved, so the user lands on labelled empty slots instead of a
            // blank page — and routine data is what the compatibility checks
            // need to run on at all.
            onSuccess={finish}
            onBack={() => { setStepIdx(TOTAL - 1); setPhase("survey"); }}
          />
        )}
        {phase === "done" && <DoneView isRetake={isRetake} />}
      </main>
    </div>
  );
}

// ---------- question view ----------
// ---------- account step ----------
function AccountStep({
  answers,
  onSuccess,
  onBack,
}: {
  answers: Answers;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "apple">(null);
  const [awaitingConfirmFor, setAwaitingConfirmFor] = useState<string | null>(null);

  // Stash answers so the OAuth or email-confirmation round trip can
  // persist them on return (localStorage survives the new tab).
  useEffect(() => {
    stashPendingAnswers(answers);
  }, [answers]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const saving = useRef(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const saveProfile = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    setSavingProfile(true);
    setSaveError(null);
    try {
      const ok = await persistAnswers(answers);
      if (!ok) throw new Error("Save failed");
      clearPendingAnswers();
      onSuccess();
    } catch {
      setSaveError("Your skin profile could not be saved. Your answers are still here; please retry.");
      setLoading(null);
    } finally {
      saving.current = false;
      setSavingProfile(false);
    }
  }, [answers, onSuccess]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        // Start after the auth callback releases its lock.
        setTimeout(() => { void saveProfile(); }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [saveProfile]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading("email");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is on: no session until the link is
          // clicked. Answers stay stashed; PendingAnswersFlush saves
          // them after the user confirms and lands back in the app.
          setAwaitingConfirmFor(email.trim());
          setLoading(null);
          return;
        }
        toast.success("Account created — saving your skin profile…");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.session) throw new Error("Sign-in did not create a session.");
        toast.success("Signed in — saving your skin profile…");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      setLoading(null);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    if (loading) return;
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + "/quiz",
      },
    });
    if (error) {
      toast.error(error.message || `Couldn't sign in with ${provider}`);
      setLoading(null);
      return;
    }
    // On success the browser is redirected to the provider.
  }

  if (awaitingConfirmFor) {
    return (
      <div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-2xl text-sage">
          ✉️
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium leading-[1.15] tracking-tight text-ink md:text-[40px]">
          Check your inbox.
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-semibold text-ink">{awaitingConfirmFor}</span>.
          Click it to activate your account — your survey answers are saved on
          this device and will attach to your profile automatically.
        </p>
        <p className="mt-3 max-w-lg text-[13px] text-muted-foreground">
          Nothing arriving? Check spam, or go back to try a different email.
        </p>
        <button
          type="button"
          onClick={() => setAwaitingConfirmFor(null)}
          className="mt-8 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-ink"
        >
          ← Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-link">
        Last step
      </p>
      <h1 className="mt-3 font-serif text-3xl font-medium leading-[1.1] tracking-tight text-ink md:text-[40px]">
        Save your skin profile.
      </h1>
      <p className="mt-3 max-w-lg text-[15px] text-muted-foreground">
        Create an account so we can remember your answers, build your match scores,
        and keep them in sync across devices.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!!loading}
          className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-warm-white px-5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-secondary/50 disabled:opacity-60"
        >
          <GoogleMark />
          {loading === "google" ? "Opening Google…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={!!loading}
          className="inline-flex items-center justify-center gap-3 rounded-xl border border-ink bg-ink px-5 py-3.5 text-[15px] font-semibold text-warm-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <AppleMark />
          {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
        </button>
      </div>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          or with email
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {saveError && <div role="alert" className="my-4 rounded-xl border border-border p-4">{saveError} <button type="button" onClick={() => void saveProfile()} disabled={savingProfile} className="underline">{savingProfile ? "Saving…" : "Retry save"}</button></div>}
      <form onSubmit={handleEmail} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label htmlFor="quiz-name" className="mb-1.5 block text-[13px] font-medium text-ink">Your name</label>
            <input
              type="text"
              id="quiz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
            />
          </div>
        )}
        <div>
          <label htmlFor="quiz-email" className="mb-1.5 block text-[13px] font-medium text-ink">Email</label>
          <input
            required
            type="email"
            id="quiz-email"
              value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="quiz-password" className="mb-1.5 block text-[13px] font-medium text-ink">Password</label>
          <input
            required
            type="password"
            minLength={8}
            id="quiz-password"
              value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            className="w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={!!loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading === "email"
            ? "Saving…"
            : mode === "signup"
              ? "Create my account →"
              : "Sign in & save →"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-[13px]">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-ink"
        >
          ← Back to quiz
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="text-muted-foreground hover:text-ink"
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
        By continuing you agree to our terms. We use your answers only to score
        products for your skin — never sold, never shared.
      </p>
    </div>
  );
}

// ---------- done ----------
