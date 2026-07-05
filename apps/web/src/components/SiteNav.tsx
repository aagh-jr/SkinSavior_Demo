"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { supabase } from "@/lib/supabase/client";

const LINKS = [
  { href: "/search", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/add", label: "Add product" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/routines", label: "Routines" },
  { href: "/community", label: "Community" },
] as const;

// "loading" until we know the session, so we don't flash the wrong CTA.
type AuthState = "loading" | "in" | "out";

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const [auth, setAuth] = useState<AuthState>("loading");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const lastY = useRef(0);
  const pathname = usePathname();

  // Track the auth session on the client so the nav can swap the
  // "Get started"/"Log in" CTAs for a profile avatar once signed in.
  useEffect(() => {
    let active = true;

    // Pull the signed-in user's saved photo so the nav icon matches the
    // avatar chosen in Settings. Falls back to the generic user glyph.
    async function loadAvatar(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      const url = (data as { avatar_url: string | null } | null)?.avatar_url;
      setAvatarUrl(url && url.toUpperCase() !== "NULL" ? url : null);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuth(data.user ? "in" : "out");
      if (data.user) void loadAvatar(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session ? "in" : "out");
      if (session?.user) void loadAvatar(session.user.id);
      else setAvatarUrl(null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
          href="/"
          className="font-serif text-2xl font-semibold tracking-tight text-ink"
        >
          skinsavior
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => {
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
          <SearchBar />
          {auth === "in" ? (
            <Link
              href="/user"
              aria-label="Your profile"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-clay transition-colors hover:bg-accent/40"
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
            </Link>
          ) : auth === "out" ? (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-ink sm:inline"
              >
                Log in
              </Link>
              <Link
                href="/quiz"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
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
