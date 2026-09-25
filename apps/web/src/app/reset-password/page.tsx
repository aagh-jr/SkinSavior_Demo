"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { PasswordField } from "@/components/account/PasswordField";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  // "checking" until the client has finished reading the recovery link, so
  // the invalid-link warning doesn't flash on a perfectly good link.
  const [link, setLink] = useState<"checking" | "ready" | "invalid">("checking");
  const ready = link === "ready";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clicking the emailed link lands here with a recovery token in the URL;
  // the client detects it and fires PASSWORD_RECOVERY once the session is set.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setLink("ready");
    });
    // getSession waits for the client to finish exchanging the link's code.
    supabase.auth.getSession().then(({ data }) => {
      setLink((prev) => (prev === "ready" || data.session ? "ready" : "invalid"));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/reset-password/done");
  }

  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[430px]`}>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Set a new password
        </h1>
        <p className="mb-[22px] mt-2.5 text-[14px] text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>

        {link === "checking" ? (
          <p className="mb-3.5 text-[13px] text-muted-foreground">Checking your link…</p>
        ) : null}
        {link === "invalid" ? (
          <div className="mb-3.5 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
            This reset link is invalid or has expired.{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new one
            </Link>
            .
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <PasswordField
            label="New password"
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            disabled={!ready || loading}
          />
          <div className="mb-2.5">
            <label className={authClass.label} htmlFor="reset-confirm">
              Confirm new password
            </label>
            <input
              id="reset-confirm"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready || loading}
              className={authClass.input}
            />
          </div>

          {error ? (
            <div className="mb-3.5 rounded-[10px] border border-destructive/40 bg-[#fdf1ee] px-3.5 py-2.5 text-[13px] text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!ready || loading}
            className={`${authClass.primaryBtn} disabled:opacity-60`}
          >
            {loading ? "Updating…" : "Update password →"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
