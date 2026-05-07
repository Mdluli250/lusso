'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import CartIcon from './CartIcon';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/collection', label: 'Collection' },
  { href: '/quiz', label: 'Find Your Scent' },
  { href: '/bundle', label: 'Build a Bundle' },
  { href: '/dashboard', label: 'Dashboard' },
] as const;

/**
 * Site-wide navigation bar.
 *
 * - Reacts to the CSS color theme via `bg-[var(--theme-bg)]` and
 *   `text-[var(--theme-accent)]` (Requirement 11.1).
 * - Shows user avatar + sign-out when authenticated; sign-in button otherwise.
 * - Includes CartIcon with live item-count badge (Requirement 6.2).
 */
export default function NavBar() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header
      className={[
        'sticky top-0 z-50',
        'bg-[var(--theme-bg)] text-[var(--theme-accent)]',
        'border-b border-white/10',
        'backdrop-blur-sm',
        'transition-colors duration-[600ms] ease-[power2.inOut]',
      ].join(' ')}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        {/* Brand logo / name */}
        <Link
          href="/"
          className={[
            'flex items-center gap-2 text-xl font-bold tracking-tight',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--theme-accent)] rounded',
          ].join(' ')}
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
          <span>Lusso</span>
        </Link>

        {/* Primary nav links — hidden on small screens, shown md+ */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  'text-[var(--theme-accent)] opacity-80',
                  'transition-opacity duration-150 hover:opacity-100',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
              >
                {label}
              </Link>
            </li>
          ))}
          {session?.user.role === 'ADMIN' && (
            <li>
              <Link
                href="/admin"
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  'text-[var(--theme-accent)] opacity-80',
                  'transition-opacity duration-150 hover:opacity-100',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
              >
                Admin
              </Link>
            </li>
          )}
        </ul>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Cart icon with badge */}
          <CartIcon />

          {/* Auth button / user avatar */}
          {isLoading ? (
            /* Skeleton placeholder while session resolves */
            <div
              aria-hidden="true"
              className="h-8 w-20 animate-pulse rounded-lg bg-white/10"
            />
          ) : session ? (
            <div className="flex items-center gap-2">
              {/* User avatar */}
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User avatar'}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
                />
              ) : (
                /* Fallback initials avatar */
                <span
                  aria-hidden="true"
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    'bg-[var(--theme-accent)] text-[var(--theme-bg)]',
                    'text-xs font-bold',
                  ].join(' ')}
                >
                  {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              )}

              {/* Sign out button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className={[
                  'hidden rounded-lg px-3 py-1.5 text-sm font-medium sm:block',
                  'border border-white/20',
                  'text-[var(--theme-accent)] opacity-80',
                  'transition-opacity duration-150 hover:opacity-100',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
              >
                Sign out
              </button>
            </div>
          ) : (
            /* Sign in button */
            <button
              onClick={() => signIn('google')}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                'bg-[var(--theme-accent)] text-white',
                'transition-opacity duration-150 hover:opacity-90',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--theme-accent)]',
              ].join(' ')}
            >
              Sign in
            </button>
          )}

          {/* Mobile nav toggle — hamburger menu (md and below) */}
          <MobileMenu isAdmin={session?.user.role === 'ADMIN'} />
        </div>
      </nav>
    </header>
  );
}

/**
 * Minimal mobile navigation drawer.
 * Renders nav links in a collapsible panel on small screens.
 */
function MobileMenu({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <div className="md:hidden">
      <details className="group relative">
        <summary
          className={[
            'flex cursor-pointer list-none items-center justify-center',
            'rounded-lg p-2',
            'text-[var(--theme-accent)] transition-colors duration-150',
            'hover:bg-white/10',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--theme-accent)]',
          ].join(' ')}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </summary>

        {/* Dropdown panel */}
        <ul
          role="list"
          className={[
            'absolute right-0 top-full mt-2 w-48',
            'rounded-xl border border-white/10',
            'bg-[var(--theme-bg)] shadow-xl',
            'py-1',
          ].join(' ')}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  'block px-4 py-2 text-sm font-medium',
                  'text-[var(--theme-accent)] opacity-80',
                  'transition-opacity duration-150 hover:opacity-100',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
              >
                {label}
              </Link>
            </li>
          ))}
          {isAdmin && (
            <li>
              <Link
                href="/admin"
                className={[
                  'block px-4 py-2 text-sm font-medium',
                  'text-[var(--theme-accent)] opacity-80',
                  'transition-opacity duration-150 hover:opacity-100',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
              >
                Admin
              </Link>
            </li>
          )}
        </ul>
      </details>
    </div>
  );
}
