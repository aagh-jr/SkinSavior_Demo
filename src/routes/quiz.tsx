import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Your skin quiz — skinsavior" },
      {
        name: "description",
        content:
          "Answer a few quick questions about your skin. We'll match you with products backed by real research.",
      },
    ],
  }),
  component: QuizPage,
});

// ---------- survey definition ----------
type Choice = { value: string; label: string; hint?: string };
type Step =
  | { key: keyof Answers; kind: "single"; title: string; sub?: string; choices: Choice[] }
  | {
      key: keyof Answers;
      kind: "multi";
      title: string;
      sub?: string;
      choices: Choice[];
      max?: number;
    };

type Answers = {
  skin_type?: string;
  concerns?: string[];
  goals?: string[];
  sensitivity?: string;
  age_range?: string;
  sun_exposure?: string;
  routine_complexity?: string;
  budget?: string;
  fragrance_pref?: string;
  pregnancy_safe?: string;
  reactions?: string;
  shopping_style?: string;
};

const STEPS: Step[] = [
  {
    key: "skin_type",
    kind: "single",
    title: "How does your skin usually feel?",
    sub: "Mid-afternoon, no products applied.",
    choices: [
      { value: "dry", label: "Tight or flaky" },
      { value: "normal", label: "Comfortable, balanced" },
      { value: "combo", label: "Oily T-zone, drier cheeks" },
      { value: "oily", label: "Shiny all over" },
    ],
  },
  {
    key: "concerns",
    kind: "multi",
    max: 3,
    title: "What do you want to work on?",
    sub: "Pick up to three.",
    choices: [
      { value: "acne", label: "Breakouts" },
      { value: "redness", label: "Redness & sensitivity" },
      { value: "texture", label: "Texture & pores" },
      { value: "dullness", label: "Dullness & tone" },
      { value: "fine_lines", label: "Fine lines" },
      { value: "dark_spots", label: "Dark spots" },
      { value: "dehydration", label: "Dehydration" },
      { value: "barrier", label: "Damaged barrier" },
    ],
  },
  {
    key: "sensitivity",
    kind: "single",
    title: "How reactive is your skin?",
    choices: [
      { value: "low", label: "Pretty bulletproof" },
      { value: "medium", label: "Occasional flare-ups" },
      { value: "high", label: "Reacts to most new things" },
    ],
  },
  {
    key: "age_range",
    kind: "single",
    title: "What's your age range?",
    sub: "Some actives behave differently across decades.",
    choices: [
      { value: "under_20", label: "Under 20" },
      { value: "20_29", label: "20 – 29" },
      { value: "30_39", label: "30 – 39" },
      { value: "40_49", label: "40 – 49" },
      { value: "50_plus", label: "50+" },
    ],
  },
  {
    key: "sun_exposure",
    kind: "single",
    title: "How much sun does your skin actually see?",
    choices: [
      { value: "low", label: "Mostly indoors" },
      { value: "medium", label: "Daily walks & windows" },
      { value: "high", label: "Outdoors most days" },
    ],
  },
  {
    key: "routine_complexity",
    kind: "single",
    title: "How involved a routine do you actually want?",
    choices: [
      { value: "minimal", label: "Three steps, tops" },
      { value: "balanced", label: "A solid 5–6 step routine" },
      { value: "enthusiast", label: "Bring on the layers" },
    ],
  },
  {
    key: "fragrance_pref",
    kind: "single",
    title: "Fragrance — friend or foe?",
    choices: [
      { value: "avoid", label: "Avoid completely" },
      { value: "mild", label: "Mild scent is fine" },
      { value: "love", label: "I like a scented routine" },
    ],
  },
  {
    key: "pregnancy_safe",
    kind: "single",
    title: "Should we filter for pregnancy-safe products?",
    choices: [
      { value: "yes", label: "Yes, please" },
      { value: "no", label: "Not needed" },
    ],
  },
  {
    key: "budget",
    kind: "single",
    title: "What's your usual price ceiling per product?",
    choices: [
      { value: "drugstore", label: "Under $20" },
      { value: "mid", label: "$20 – $50" },
      { value: "prestige", label: "$50 – $100" },
      { value: "luxury", label: "$100+" },
    ],
  },
  {
    key: "reactions",
    kind: "single",
    title: "Any ingredient you've reacted to before?",
    choices: [
      { value: "fragrance", label: "Fragrance" },
      { value: "alcohol", label: "Drying alcohols" },
      { value: "actives", label: "Retinoids or acids" },
      { value: "essential_oils", label: "Essential oils" },
      { value: "none", label: "Nothing I know of" },
    ],
  },
  {
    key: "goals",
    kind: "multi",
    max: 2,
    title: "What does success look like in 90 days?",
    sub: "Pick up to two.",
    choices: [
      { value: "clear_skin", label: "Clearer skin" },
      { value: "glow", label: "More glow" },
      { value: "calm", label: "Calmer, less reactive" },
      { value: "smooth", label: "Smoother texture" },
      { value: "even_tone", label: "Even tone" },
      { value: "stronger_barrier", label: "Stronger barrier" },
    ],
  },
  {
    key: "shopping_style",
    kind: "single",
    title: "How do you usually pick skincare?",
    choices: [
      { value: "research", label: "I research everything" },
      { value: "reviews", label: "I follow reviews" },
      { value: "creators", label: "I follow creators" },
      { value: "vibes", label: "Honestly? Vibes." },
    ],
  },
];

const TOTAL = STEPS.length;

// ---------- main component ----------
function QuizPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<"survey" | "account" | "done">("survey");
  const router = useRouter();

  // If user is already signed in, save and skip to done
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && phase === "account") {
        void persistAnswers(answers).then(() => setPhase("done"));
      }
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <Toaster richColors position="top-center" />
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-6 py-5">
          <Link
            to="/"
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
          />
        )}
        {phase === "account" && (
          <AccountStep
            answers={answers}
            onSuccess={() => {
              setPhase("done");
              setTimeout(() => router.navigate({ to: "/" }), 1800);
            }}
            onBack={() => setStepIdx(TOTAL - 1)}
          />
        )}
        {phase === "done" && <DoneView />}
      </main>
    </div>
  );
}

// ---------- question view ----------
function QuestionView({
  step,
  value,
  onChange,
  onNext,
  onBack,
  canBack,
  canContinue,
  isLast,
}: {
  step: Step;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
  canBack: boolean;
  canContinue: boolean;
  isLast: boolean;
}) {
  const multi = step.kind === "multi";
  const selected = useMemo(
    () => (multi ? (Array.isArray(value) ? value : []) : value),
    [value, multi],
  );

  function toggle(v: string) {
    if (!multi) {
      onChange(v);
      return;
    }
    const cur = Array.isArray(selected) ? selected : [];
    const has = cur.includes(v);
    const max = (step as Extract<Step, { kind: "multi" }>).max ?? 99;
    if (has) onChange(cur.filter((x) => x !== v));
    else if (cur.length < max) onChange([...cur, v]);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium leading-[1.15] tracking-tight text-ink md:text-[40px]">
        {step.title}
      </h1>
      {step.sub && (
        <p className="mt-3 text-[15px] text-muted-foreground">{step.sub}</p>
      )}

      <div className="mt-9 grid gap-3 md:grid-cols-2">
        {step.choices.map((c) => {
          const active = multi
            ? Array.isArray(selected) && selected.includes(c.value)
            : selected === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => toggle(c.value)}
              className={[
                "flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 shadow-[0_4px_14px_-6px_rgba(154,74,47,0.35)]"
                  : "border-border bg-warm-white hover:border-primary/40 hover:bg-secondary/40",
              ].join(" ")}
            >
              <span className="text-[15px] font-medium text-ink">{c.label}</span>
              <span
                className={[
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                ].join(" ")}
                aria-hidden
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-ink disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? "See my results" : "Continue"} <span>→</span>
        </button>
      </div>
    </div>
  );
}

// ---------- account step ----------
async function persistAnswers(answers: Answers) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return;
  const userId = sess.session.user.id;
  const update = {
    id: userId,
    skin_type: answers.skin_type ?? null,
    concerns: answers.concerns ?? [],
    goals: answers.goals ?? [],
    age_range: answers.age_range ?? null,
    sensitivity: answers.sensitivity ?? null,
    sun_exposure: answers.sun_exposure ?? null,
    routine_complexity: answers.routine_complexity ?? null,
    budget: answers.budget ?? null,
    fragrance_pref: answers.fragrance_pref ?? null,
    pregnancy_safe: answers.pregnancy_safe === "yes",
    answers: answers as Record<string, unknown>,
  };
  await supabase.from("profiles").upsert(update, { onConflict: "id" });
}

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

  // Stash answers so OAuth round-trip can persist them on return
  useEffect(() => {
    try {
      sessionStorage.setItem("skinsavior:pendingAnswers", JSON.stringify(answers));
    } catch {
      /* ignore */
    }
  }, [answers]);

  // After OAuth returns, persist
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        const raw = sessionStorage.getItem("skinsavior:pendingAnswers");
        const a = raw ? (JSON.parse(raw) as Answers) : answers;
        void persistAnswers(a).then(() => {
          sessionStorage.removeItem("skinsavior:pendingAnswers");
          onSuccess();
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [answers, onSuccess]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading("email");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Account created — saving your skin profile…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
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
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/quiz",
    });
    if (result.error) {
      toast.error(result.error.message || `Couldn't sign in with ${provider}`);
      setLoading(null);
      return;
    }
    // If redirected, browser is leaving the page
  }

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
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

      <form onSubmit={handleEmail} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              className="w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink">
            Email
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl border border-border bg-warm-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink">
            Password
          </label>
          <input
            required
            type="password"
            minLength={8}
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
function DoneView() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-2xl text-sage">
        ✓
      </div>
      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">
        Your skin profile is saved.
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        We're matching you to products now. Taking you home…
      </p>
    </div>
  );
}

// ---------- brand marks ----------
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.9v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.04l3.07-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.88 11.43 0 9 0A9 9 0 0 0 .9 4.96l3.07 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden>
      <path d="M13.04 9.55c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.56-1.67-3.12-1.69-1.33-.13-2.6.78-3.27.78-.69 0-1.71-.76-2.82-.74-1.45.02-2.8.84-3.55 2.14-1.52 2.64-.39 6.54 1.09 8.68.72 1.05 1.58 2.23 2.7 2.18 1.09-.04 1.5-.7 2.81-.7 1.31 0 1.68.7 2.82.68 1.17-.02 1.91-1.06 2.62-2.12.83-1.21 1.17-2.39 1.19-2.45-.03-.01-2.27-.87-2.29-3.46zM10.95 3.18c.6-.73 1.01-1.74.9-2.74-.87.04-1.91.58-2.53 1.3-.55.64-1.04 1.66-.91 2.65.96.07 1.95-.49 2.54-1.21z" />
    </svg>
  );
}
