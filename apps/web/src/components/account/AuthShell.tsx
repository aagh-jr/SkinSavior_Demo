import Link from "next/link";

/**
 * Minimal header + centered card surface + footer used by the account-flow
 * screens (login, signup, verify, password reset). Mirrors the "Account Flows"
 * prototype — logo on the left, optional back link on the right.
 */
export function AuthShell({
  children,
  back,
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-10 py-5">
        <Link
          href="/"
          className="font-serif text-[22px] font-semibold tracking-tight text-ink"
        >
          skinsavior
        </Link>
        {back ? (
          <Link
            href={back.href}
            className="text-[13px] text-muted-foreground transition-colors hover:text-ink"
          >
            {back.label}
          </Link>
        ) : null}
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        {children}
      </main>

      <footer className="px-5 py-5 text-center text-xs text-muted-foreground">
        <span>Privacy</span> · <span>Terms</span> · <span>Contact</span> · © 2026
        skinsavior
      </footer>
    </div>
  );
}

/** Shared input + button styles so the account screens stay consistent. */
export const authClass = {
  card: "w-full rounded-[18px] border border-border bg-warm-white p-[34px] shadow-[0_24px_60px_-34px_rgba(60,45,25,0.4)]",
  label: "mb-1.5 block text-[13px] font-semibold text-ink",
  input:
    "w-full box-border rounded-[11px] border border-border bg-white px-3.5 py-3 text-[15px] text-ink outline-none transition-colors focus:border-clay",
  primaryBtn:
    "w-full rounded-[11px] bg-primary px-6 py-3.5 text-[15px] font-bold text-primary-foreground transition-opacity hover:opacity-90",
} as const;
