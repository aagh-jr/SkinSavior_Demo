import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, authClass } from "@/components/account/AuthShell";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[430px]`}>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Forgot your password?
        </h1>
        <p className="mb-[22px] mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          No problem. Enter the email on your account and we&apos;ll send a link
          to reset it.
        </p>
        <div className="mb-5">
          <label className={authClass.label}>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            className={authClass.input}
          />
        </div>
        <Link
          href="/forgot-password/sent"
          className={authClass.primaryBtn + " inline-block text-center"}
        >
          Send reset link →
        </Link>
        <div className="mt-[18px] text-center text-[13px]">
          <Link href="/login" className="text-muted-foreground">
            ← Back to log in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
