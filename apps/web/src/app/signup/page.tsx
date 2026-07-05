"use client";

import Link from "next/link";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { PasswordField } from "@/components/account/PasswordField";

export default function SignupPage() {
  return (
    <AuthShell back={{ href: "/", label: "← Back to home" }}>
      <div className={`${authClass.card} max-w-[448px]`}>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay">
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
          <Link
            href="/signup/verify"
            className="flex items-center justify-center gap-2 rounded-[11px] border border-border bg-white px-3 py-3 text-[14px] font-semibold text-ink transition-colors hover:bg-[#faf6ee]"
          >
            <span className="inline-block h-4 w-4 rounded-full bg-[#4285F4]" />
            Google
          </Link>
          <Link
            href="/signup/verify"
            className="flex items-center justify-center gap-2 rounded-[11px] border border-ink bg-ink px-3 py-3 text-[14px] font-semibold text-warm-white transition-opacity hover:opacity-90"
          >
            Apple
          </Link>
        </div>

        <div className="my-5 flex items-center gap-3.5">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            or with email
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-3.5">
          <label className={authClass.label}>Your name</label>
          <input
            type="text"
            placeholder="Alex Morgan"
            className={authClass.input}
          />
        </div>
        <div className="mb-3.5">
          <label className={authClass.label}>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            className={authClass.input}
          />
        </div>
        <PasswordField placeholder="At least 8 characters" />

        <Link
          href="/signup/verify"
          className={authClass.primaryBtn + " mt-1.5 inline-block text-center"}
        >
          Create account →
        </Link>
        <div className="mt-[18px] text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-clay">
            Log in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
