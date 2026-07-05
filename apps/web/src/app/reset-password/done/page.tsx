import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, authClass } from "@/components/account/AuthShell";

export const metadata: Metadata = { title: "Password updated" };

export default function ResetDonePage() {
  return (
    <AuthShell>
      <div className={`${authClass.card} max-w-[430px] text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sage-bg text-[30px] text-sage">
          ✓
        </div>
        <h1 className="font-serif text-[30px] font-medium tracking-tight text-ink">
          Password updated
        </h1>
        <p className="my-3.5 text-[15px] leading-relaxed text-muted-foreground">
          Your password has been changed. You can now log in with your new
          password.
        </p>
        <Link href="/login" className={authClass.primaryBtn + " inline-block"}>
          Continue to log in →
        </Link>
      </div>
    </AuthShell>
  );
}
