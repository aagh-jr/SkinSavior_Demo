"use client";

import Link from "next/link";
import { AuthShell, authClass } from "@/components/account/AuthShell";
import { PasswordField } from "@/components/account/PasswordField";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[430px]`}>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Set a new password
        </h1>
        <p className="mb-[22px] mt-2.5 text-[14px] text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>

        <PasswordField label="New password" placeholder="At least 8 characters" />
        <div className="mb-2.5">
          <label className={authClass.label}>Confirm new password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
            className={authClass.input}
          />
        </div>

        <div className="mb-5 flex items-center gap-2">
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-sage-bg">
            <div className="h-full w-3/4 bg-sage" />
          </div>
          <span className="text-xs font-semibold text-sage">Strong</span>
        </div>

        <Link
          href="/reset-password/done"
          className={authClass.primaryBtn + " inline-block text-center"}
        >
          Update password →
        </Link>
      </div>
    </AuthShell>
  );
}
