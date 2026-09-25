"use client";

// Real account creation.
//
// This page used to be a mockup: the inputs had no state, and "Create account"
// was a <Link> to /signup/verify, which showed a "check your inbox" screen for
// an email nobody had sent. Anyone who signed up here believed they had an
// account and did not.
//
// The quiz has always had a working signup (its AccountStep) because that is
// the path most people take. This brings the standalone page up to the same
// standard, and sends people to the quiz afterwards — an account with no skin
// profile can't score anything, so the profile is the point.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { PasswordField } from "@/components/account/PasswordField";
import { UsernameField } from "@/components/account/UsernameField";
import { isUsernameTaken, normalizeUsername, validateUsername } from "@/lib/username";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "apple">(null);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmFor, setAwaitingConfirmFor] = useState<string | null>(null);

  // A session can appear from OAuth returning, or from signUp when the project
  // has email confirmation switched off. Both mean the same thing here.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        router.push("/quiz");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setUsernameError(null);

    const handle = normalizeUsername(username);
    const handleProblem = validateUsername(handle);
    if (handleProblem) {
      setUsernameError(handleProblem);
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }
    // Supabase rejects anything shorter, but it does so after a round trip and
    // with a less clear message.
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setLoading("email");
    try {
      if (await isUsernameTaken(handle)) {
        setUsernameError("That username is taken.");
        setLoading(null);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/quiz",
          data: { display_name: name.trim() || undefined, username: handle },
        },
      });
      if (signUpError) throw signUpError;

      if (!data.session) {
        // Email confirmation is on, so there is no session until the link is
        // clicked. Say so plainly rather than showing a success screen for an
        // account that is not usable yet.
        setAwaitingConfirmFor(email.trim());
        setLoading(null);
        return;
      }
      toast.success("Account created — let's build your skin profile.");
      router.push("/quiz");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
      setLoading(null);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    if (loading) return;
    setError(null);
    setLoading(provider);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + "/quiz" },
    });
    if (oauthError) {
      setError(oauthError.message || `Couldn't continue with ${provider}.`);
      setLoading(null);
    }
    // On success the browser leaves for the provider.
  }

  if (awaitingConfirmFor) {
    return (
      <AuthShell back={{ href: "/signup", label: "← Use a different email" }}>
        <div className={`${authClass.card} max-w-[448px]`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-bg text-2xl">
            ✉️
          </div>
          <h1 className="mt-5 font-serif text-[28px] font-medium tracking-tight text-ink">
            Confirm your email.
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            We sent a link to{" "}
            <span className="font-semibold text-ink">{awaitingConfirmFor}</span>.
            Your account isn&apos;t active until you click it.
          </p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            Nothing arriving? Check spam, or go back and try another address.
          </p>
          <button
            type="button"
            onClick={() => setAwaitingConfirmFor(null)}
            className="mt-6 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-ink"
          >
            ← Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  const busy = loading !== null;

  return (
    <AuthShell back={{ href: "/", label: "← Back to home" }}>
      <form onSubmit={handleEmail} className={`${authClass.card} max-w-[448px]`}>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-link">
          Create your account
        </div>
        <h1 className="mt-2.5 font-serif text-[30px] font-medium tracking-tight text-ink">
          Save your skin profile.
        </h1>
        <p className="mb-[22px] mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          So we can remember your answers and keep your matches in sync across
          devices.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-[11px] border border-border bg-white px-3 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-[#faf6ee] disabled:opacity-60"
          >
            <span className="inline-block h-4 w-4 rounded-full bg-[#4285F4]" />
            {loading === "google" ? "Opening…" : "Google"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-[11px] border border-ink bg-ink px-3 py-3 text-[14px] font-semibold text-warm-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading === "apple" ? "Opening…" : "Apple"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3.5">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            or with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-3.5">
          <label className={authClass.label} htmlFor="signup-name">
            Your name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className={authClass.input}
          />
        </div>
        <UsernameField
          id="signup-username"
          value={username}
          onChange={(v) => {
            setUsername(v);
            setUsernameError(null);
          }}
          error={usernameError}
          disabled={busy}
        />
        <div className="mb-3.5">
          <label className={authClass.label} htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className={authClass.input}
          />
        </div>
        <PasswordField
          placeholder="At least 8 characters"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={busy}
        />

        {error ? (
          <div className="mb-3.5 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={authClass.primaryBtn + " mt-1.5 w-full disabled:opacity-60"}
        >
          {loading === "email" ? "Creating your account…" : "Create account →"}
        </button>

        <div className="mt-[18px] text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-link">
            Log in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
