"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/search", label: "Products" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/routines", label: "Routines" },
  { href: "/community", label: "Community" },
  { href: "/user", label: "User" },
] as const;

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const pathname = usePathname();

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
          <Link
            href="/quiz"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started <span>→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
