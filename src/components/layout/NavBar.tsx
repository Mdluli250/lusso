"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import CartIcon from "./CartIcon";

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/collections", label: "Shop" },
  { href: "/experiences", label: "Experiences" },
  { href: "/contact", label: "Contact" },
];

/**
 * Site-wide navigation bar.
 *
 * - Reacts to the CSS color theme via `bg-[var(--theme-bg)]` and
 *   `text-[var(--theme-accent)]`.
 * - Shows user avatar + sign-out when authenticated; sign-in button otherwise.
 * - Includes CartIcon with live item-count badge.
 * - Active link indicator using usePathname().
 * - Mobile hamburger menu with overlay, focus trap, and outside-click dismissal below 768px.
 * - <details> no-JS fallback for mobile navigation.
 */
export default function NavBar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const pathname = usePathname();

  return (
    <header
      className={[
        "sticky top-0 z-50",
        "bg-[var(--theme-bg)] text-[var(--theme-accent)]",
        "border-b border-[var(--border)]",
        "backdrop-blur-sm",
        "transition-colors duration-[600ms] ease-[power2.inOut]",
      ].join(" ")}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        {/* Brand logo / name */}
        <Link
          href="/"
          className={[
            "flex items-center gap-2 text-xl font-bold tracking-tight",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:outline-[var(--theme-accent)] rounded",
          ].join(" ")}
        >
          {/* Flame icon */}
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-serif font-normal tracking-wider">Lusso</span>
        </Link>

        {/* Primary nav links — hidden on small screens, shown md+ */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] inline-flex items-center",
                    "text-[var(--theme-accent)]",
                    "transition-opacity duration-150",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--theme-accent)]",
                    isActive
                      ? "opacity-100 border-b-2 border-[var(--theme-accent)]"
                      : "opacity-70 hover:opacity-100",
                  ].join(" ")}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          {session && (
            <li>
              <Link
                href="/dashboard"
                aria-current={
                  pathname.startsWith("/dashboard") ? "page" : undefined
                }
                className={[
                  "rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] inline-flex items-center",
                  "text-[var(--theme-accent)]",
                  "transition-opacity duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-[var(--theme-accent)]",
                  pathname.startsWith("/dashboard")
                    ? "opacity-100 border-b-2 border-[var(--theme-accent)]"
                    : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                Dashboard
              </Link>
            </li>
          )}
          {session?.user.role === "ADMIN" && (
            <li>
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={[
                  "rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] inline-flex items-center",
                  "text-[var(--theme-accent)]",
                  "transition-opacity duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-[var(--theme-accent)]",
                  pathname === "/admin"
                    ? "opacity-100 border-b-2 border-[var(--theme-accent)]"
                    : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                Admin
              </Link>
            </li>
          )}
        </ul>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          {/* Search icon */}
          <Link
            href="/collection"
            className="p-2 rounded-lg text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
            aria-label="Search products"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </Link>

          {/* Wishlist icon */}
          <Link
            href="/dashboard/wishlist"
            className="relative p-2 rounded-lg text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
            aria-label="Wishlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </Link>

          {/* Cart icon with badge */}
          <CartIcon />

          {/* Auth button / user avatar */}
          {isLoading ? (
            /* Skeleton placeholder while session resolves */
            <div
              aria-hidden="true"
              className="h-8 w-20 animate-pulse rounded-lg bg-[var(--theme-accent)]/5"
            />
          ) : session ? (
            <div className="flex items-center gap-2">
              {/* User avatar */}
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--border)]"
                />
              ) : (
                /* Fallback initials avatar */
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-[var(--theme-accent)] text-cream",
                    "text-xs font-bold",
                  ].join(" ")}
                >
                  {session.user.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              )}

              {/* Sign out button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={[
                  "hidden rounded-lg px-3 py-2.5 text-sm font-medium sm:block min-h-[44px]",
                  "border border-[var(--border)]",
                  "text-[var(--theme-accent)] opacity-80",
                  "transition-opacity duration-150 hover:opacity-100",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-[var(--theme-accent)]",
                ].join(" ")}
              >
                Sign out
              </button>
            </div>
          ) : (
            /* Sign in button */
            <button
              onClick={() => signIn("google")}
              className={[
                "rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px]",
                "bg-[var(--theme-accent)] text-cream",
                "transition-opacity duration-150 hover:opacity-90",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--theme-accent)]",
              ].join(" ")}
            >
              Sign in
            </button>
          )}

          {/* Mobile nav toggle — hamburger menu (md and below) */}
          <MobileMenu
            isAdmin={session?.user.role === "ADMIN"}
            isSignedIn={!!session}
            pathname={pathname}
          />
        </div>
      </nav>
    </header>
  );
}

/**
 * Mobile navigation with overlay, focus trap, and outside-click dismissal.
 * Includes a <details> no-JS fallback that is hidden when JS is available.
 *
 * Accessibility:
 * - Focus trap: Tab cycles within the overlay while open
 * - Escape key closes the menu
 * - Outside click closes the menu
 * - Focus returns to the hamburger button on close
 * - Links are activatable via Enter
 * - When a link is selected, menu closes and navigates
 */
function MobileMenu({
  isAdmin,
  isSignedIn,
  pathname,
}: {
  isAdmin?: boolean;
  isSignedIn?: boolean;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const allLinks = [
    ...NAV_LINKS,
    ...(isSignedIn ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    // Return focus to the trigger button
    triggerRef.current?.focus();
  }, []);

  // Handle Escape key to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  // Focus trap: constrain Tab within the menu while open
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const focusableSelector =
      'a[href], button, [tabindex]:not([tabindex="-1"])';

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements =
        menu.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabTrap);
    return () => document.removeEventListener("keydown", handleTabTrap);
  }, [isOpen]);

  // Move focus to first focusable element when menu opens
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const focusableSelector =
      'a[href], button, [tabindex]:not([tabindex="-1"])';
    const firstFocusable =
      menuRef.current.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
  }, [isOpen]);

  // Handle outside click on overlay backdrop
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      closeMenu();
    }
  };

  return (
    <div className="md:hidden">
      {/* JS-enhanced hamburger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        className={[
          "flex cursor-pointer items-center justify-center",
          "rounded-lg p-2",
          "text-[var(--theme-accent)] transition-colors duration-150",
          "hover:bg-[var(--theme-accent)]/5",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[var(--theme-accent)]",
        ].join(" ")}
      >
        {isOpen ? (
          /* Close icon */
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          /* Hamburger icon */
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {/* Mobile menu overlay with focus trap */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/50"
          onClick={handleOverlayClick}
          aria-hidden="true"
        >
          <div
            ref={menuRef}
            id="mobile-nav-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={[
              "absolute right-0 top-0 h-full w-64 max-w-[80vw]",
              "bg-[var(--theme-bg)] shadow-xl",
              "flex flex-col",
              "pt-16 px-4",
            ].join(" ")}
          >
            {/* Close button inside the menu panel */}
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close navigation menu"
              className={[
                "absolute top-4 right-4",
                "flex items-center justify-center rounded-lg p-2",
                "text-[var(--theme-accent)] transition-colors duration-150",
                "hover:bg-[var(--theme-accent)]/5",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--theme-accent)]",
              ].join(" ")}
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Navigation links */}
            <ul role="list" className="flex flex-col gap-1">
              {allLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "block rounded-lg px-4 py-3 text-base font-medium min-h-[44px]",
                        "text-[var(--theme-accent)]",
                        "transition-opacity duration-150",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                        "focus-visible:outline-[var(--theme-accent)]",
                        isActive
                          ? "opacity-100 bg-[var(--theme-accent)]/10 border-l-2 border-[var(--theme-accent)]"
                          : "opacity-70 hover:opacity-100 hover:bg-[var(--theme-accent)]/5",
                      ].join(" ")}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* No-JS fallback using <details> — hidden when JS is available */}
      <noscript>
        <details className="group relative">
          <summary
            className={[
              "flex cursor-pointer list-none items-center justify-center",
              "rounded-lg p-2",
              "text-[var(--theme-accent)] transition-colors duration-150",
              "hover:bg-[var(--theme-accent)]/5",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--theme-accent)]",
            ].join(" ")}
            aria-label="Open navigation menu"
          >
            {/* Hamburger icon */}
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 group-open:hidden"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            {/* Close icon */}
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="hidden h-6 w-6 group-open:block"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </summary>

          {/* Dropdown panel */}
          <ul
            role="list"
            className={[
              "absolute right-0 top-full mt-2 w-48",
              "rounded-xl border border-[var(--border)]",
              "bg-[var(--theme-bg)] shadow-xl",
              "py-1",
            ].join(" ")}
          >
            {allLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "block px-4 py-2 text-sm font-medium",
                    "text-[var(--theme-accent)] opacity-80",
                    "transition-opacity duration-150 hover:opacity-100",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--theme-accent)]",
                  ].join(" ")}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </noscript>
    </div>
  );
}
