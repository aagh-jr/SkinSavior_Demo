"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import type { AuthState } from "@/hooks/useSession";

// Primary nav destinations, in display order. "For you" and "Ingredients" are
// hidden for the upcoming release — still in development, not ready to ship.
// "My shelf" (the user's own products, saved items, routines) is inserted at
// position 2 only when signed in — see the nav render below.
const HOME_LINK = { href: "/home", label: "Home" } as const;
const SHELF_LINK = { href: "/shelf", label: "My shelf" } as const;
const BROWSE_LINKS = [
  { href: "/search", label: "Products" },
  // As an A-Z index over 400+ brands it's a known-item shortcut Products
  // can't offer.
  { href: "/brands", label: "Brands" },
] as const;

/**
 * Presentational site header. Session state (auth, avatarUrl) and sign-out
 * arrive via props from useSession; the component owns only UI concerns
 * (scroll hide/reveal, the profile menu). No Supabase access here.
 */
export function SiteNavView({
  auth,
  avatarUrl,
  onSignOut,
}: {
  auth: AuthState;
  avatarUrl: string | null;
  onSignOut: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close the profile menu on any route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the profile menu when clicking outside it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSignOut() {
    setMenuOpen(false);
    onSignOut();
  }

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // Always show near top
      if (y < 80) {
        setHidden(false);
      } else if (delta > 6) {
        // Scrolling down — hide
        setHidden(true);
      } else if (delta < -6) {
        // Scrolling up — reveal
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur transition-transform duration-300 " +
        (hidden ? "-translate-y-full" : "translate-y-0")
      }
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-5 md:px-14">
        <Link
          href="/home"
          className="font-serif text-2xl font-semibold tracking-tight text-ink"
        >
          skinsavior
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {/* Order: Home · My shelf (signed-in only) · Products · Brands. */}
          {[
            HOME_LINK,
            ...(auth === "in" ? [SHELF_LINK] : []),
            ...BROWSE_LINKS,
          ].map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "text-sm font-semibold text-ink"
                    : "text-sm text-muted-foreground transition-colors hover:text-ink"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:block">
            <SearchBar />
          </div>
          {auth === "in" ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Your account"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-link transition-colors hover:bg-accent/40"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Your profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-3.87 3.58-7 8-7s8 3.13 8 7" />
                  </svg>
                )}
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg"
                >
                  <Link
                    href="/user"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-muted"
                  >
                    Your profile
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-muted"
                  >
                    Settings
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-[#fdf1ee]"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : auth === "out" ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/quiz"
                className="hidden items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:inline-flex"
              >
                Get started <span>→</span>
              </Link>
            </>
          ) : (
            // auth === "loading": reserve space to avoid layout shift.
            <div className="h-10 w-10 flex-shrink-0" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}
