"use client";

/**
 * TEMPORARY dev navigator — a port of the "Account Flows" prototype sidebar.
 *
 * It floats over the app and links every page in the codebase so flows can be
 * clicked through before auth exists. It minimizes to a thin icon rail when
 * idle and pops open on hover (or pin it open). This whole component is meant
 * to be deleted once Supabase auth is reconnected and real navigation/routing
 * gates these screens.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  UserPlus,
  MailCheck,
  Home,
  LogIn,
  KeyRound,
  Send,
  Lock,
  CheckCircle2,
  User,
  Settings,
  RefreshCw,
  Search,
  FlaskConical,
  ListChecks,
  Users,
  ClipboardList,
  Package,
  Heart,
  Loader,
  Pin,
  PinOff,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; path: string; label: string; icon: LucideIcon };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Account creation",
    items: [
      { href: "/", path: "/", label: "Landing — signed out", icon: Globe },
      { href: "/signup", path: "/signup", label: "Sign up", icon: UserPlus },
      { href: "/signup/verify", path: "/signup/verify", label: "Check your inbox", icon: MailCheck },
      { href: "/home", path: "/home", label: "Home — signed in", icon: Home },
    ],
  },
  {
    title: "Sign in & password reset",
    items: [
      { href: "/login", path: "/login", label: "Log in", icon: LogIn },
      { href: "/forgot-password", path: "/forgot-password", label: "Forgot password", icon: KeyRound },
      { href: "/forgot-password/sent", path: "/forgot-password/sent", label: "Reset link sent", icon: Send },
      { href: "/reset-password", path: "/reset-password", label: "Set new password", icon: Lock },
      { href: "/reset-password/done", path: "/reset-password/done", label: "Password updated", icon: CheckCircle2 },
    ],
  },
  {
    title: "Profile & settings",
    items: [
      { href: "/user", path: "/user", label: "My profile", icon: User },
      { href: "/settings", path: "/settings", label: "Edit profile & settings", icon: Settings },
      { href: "/quiz?retake=1", path: "/quiz", label: "Retake the quiz", icon: RefreshCw },
    ],
  },
  {
    title: "Browse",
    items: [
      { href: "/search", path: "/search", label: "Products", icon: Search },
      { href: "/ingredients", path: "/ingredients", label: "Ingredients", icon: FlaskConical },
      { href: "/routines", path: "/routines", label: "Routines", icon: ListChecks },
      { href: "/community", path: "/community", label: "Community", icon: Users },
      { href: "/quiz", path: "/quiz", label: "Quiz", icon: ClipboardList },
      { href: "/product/serum", path: "/product/serum", label: "Product example", icon: Package },
    ],
  },
  {
    title: "Saved & states",
    items: [
      { href: "/saved", path: "/saved", label: "Saved products", icon: Heart },
      { href: "/loading", path: "/loading", label: "Loading state", icon: Loader },
    ],
  },
];

const STORAGE_KEY = "ss-devnav-pinned";

export function DevNavigator() {
  const pathname = usePathname();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const togglePin = () => {
    setPinned((p) => {
      const next = !p;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const open = hover || pinned;
  const isActive = (item: NavItem) => pathname === item.path;

  return (
    <aside
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={
        "fixed left-3 top-1/2 z-[60] flex max-h-[88vh] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[#e2dccf] bg-[#f3eee4] shadow-[0_18px_50px_-20px_rgba(60,45,25,0.45)] transition-[width] duration-200 ease-out " +
        (open ? "w-[260px]" : "w-[58px]")
      }
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#e7e0d2] px-3 py-3">
        <button
          type="button"
          onClick={togglePin}
          title={pinned ? "Unpin navigator" : "Pin navigator open"}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink font-serif text-[16px] font-semibold text-warm-white"
        >
          s
        </button>
        {open ? (
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[15px] font-semibold leading-none text-ink">
              skinsavior
            </div>
            <div className="mt-1 truncate font-mono text-[10px] tracking-[0.02em] text-[#9a8c75]">
              Account flows · prototype
            </div>
          </div>
        ) : null}
        {open ? (
          <button
            type="button"
            onClick={togglePin}
            title={pinned ? "Unpin" : "Pin open"}
            className={
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#ece4d6] " +
              (pinned ? "text-clay" : "text-[#9a8c75]")
            }
          >
            {pinned ? <Pin size={15} /> : <PinOff size={15} />}
          </button>
        ) : null}
      </div>

      {/* Links */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mt-2 first:mt-0">
            {open ? (
              <div className="px-2.5 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#9a8c75]">
                {group.title}
              </div>
            ) : (
              <div className="mx-auto my-1.5 h-px w-6 bg-[#e7e0d2] first:hidden" />
            )}
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={
                    (open
                      ? "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] "
                      : "mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-[9px] ") +
                    (active
                      ? "bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(60,45,25,0.1)]"
                      : "text-[#6b5f4f] hover:bg-[#ece4d6]")
                  }
                >
                  <Icon
                    size={16}
                    className={active ? "text-clay" : ""}
                    strokeWidth={2}
                  />
                  {open ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer note */}
      {open ? (
        <div className="border-t border-[#e7e0d2] px-3.5 py-2.5 text-[10.5px] leading-snug text-[#9a8c75]">
          Temporary navigator — removed when Supabase auth is reconnected.
        </div>
      ) : null}
    </aside>
  );
}
