'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DASHBOARD_LINKS = [
  { href: '/dashboard', label: 'Orders' },
  { href: '/dashboard/wishlist', label: 'Wishlist' },
  { href: '/dashboard/subscriptions', label: 'Subscriptions' },
  { href: '/dashboard/settings', label: 'Settings' },
] as const;

/**
 * DashboardNav — consistent sub-navigation rendered across all /dashboard pages.
 * Highlights the active section using usePathname().
 */
export function DashboardNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Dashboard navigation"
      className="border-b border-[var(--theme-accent)]/10 bg-[var(--theme-bg)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-1 overflow-x-auto py-3" role="list">
          {DASHBOARD_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  'rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive(href)
                    ? 'bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]'
                    : 'text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5',
                ].join(' ')}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
