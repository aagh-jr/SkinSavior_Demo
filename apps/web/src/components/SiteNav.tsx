"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { supabase } from "@/lib/supabase/client";

// Browse destinations. "My shelf" is deliberately NOT here — it's personal
// rather than catalogue, so it sits apart on the right (see SHELF_LINK).
const LINKS = [
  { href: "/for-you", label: "For you" },
  { href: "/search", label: "Products" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/brands", label: "Brands" },
] as const;

/** The user's own stuff: products in use, saved products, routines. */
const SHELF_LINK = { href: "/shelf", label: "My shelf" } as const;

// "loading" until we know the session, so we don't flash the wrong CTA.
type AuthState = "loading" | "in" | "out";

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const [auth, setAuth] = useState<AuthState>("loading");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    // onAuthStateChange flips the nav to signed-out; send them to the landing.
    router.push("/");
    router.refresh();
  }

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
          href="/home"
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
          {/* Separated from the browse links: this is the user's own shelf,
              not another way to browse the catalogue. */}
          {auth === "in" && (
            <Link
              href={SHELF_LINK.href}
              className={
                "border-l border-border pl-6 " +
                (pathname === SHELF_LINK.href
                  ? "text-sm font-semibold text-ink"
                  : "text-sm text-muted-foreground transition-colors hover:text-ink")
              }
            >
              {SHELF_LINK.label}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 md:gap-4">
          <SearchBar />
          {auth === "in" ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Your account"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
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
