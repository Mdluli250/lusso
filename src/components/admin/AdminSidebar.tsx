'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Inventory', href: '/admin/inventory' },
  { label: 'Reviews', href: '/admin/reviews' },
];

/**
 * AdminSidebar — persistent navigation for the admin dashboard.
 * On mobile (<768px) it renders as an overlay with a close button.
 * Highlights the active route using usePathname().
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */
export function AdminSidebar({ user, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-0 left-0 z-30 h-full w-64 flex flex-col',
          'bg-surface border-r border-border',
          'transition-transform duration-200 ease-in-out',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'md:translate-x-0 md:static md:z-auto',
        ].join(' ')}
      >
        {/* Header with user info */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.name || 'Admin'}
            </p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded text-muted hover:text-foreground"
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-theme-accent/15 text-theme-accent'
                  : 'text-foreground hover:bg-surface-muted',
              ].join(' ')}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
