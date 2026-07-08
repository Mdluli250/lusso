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
  { label: 'Overview', href: '/admin', icon: '📊' },
  { label: 'Products', href: '/admin/products', icon: '🕯️' },
  { label: 'Orders', href: '/admin/orders', icon: '📦' },
  { label: 'Inventory', href: '/admin/inventory', icon: '🏷️' },
  { label: 'Reviews', href: '/admin/reviews', icon: '⭐' },
  { label: 'Bundles', href: '/admin/bundles', icon: '🎁' },
  { label: 'Discounts', href: '/admin/discounts', icon: '🎟️' },
  { label: 'Gallery', href: '/admin/gallery', icon: '🖼️' },
  // Requirement 3.4: CMS admin UI renders within the existing admin shell sidebar navigation
  { label: 'Content', href: '/admin/content', icon: '📝' },
  { label: 'Collections', href: '/admin/collections', icon: '🗂️' },
  { label: 'Customers', href: '/admin/customers', icon: '👥' },
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
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-theme-accent/15 text-theme-accent'
                  : 'text-foreground hover:bg-surface-muted',
              ].join(' ')}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom: back to site */}
        <div className="p-3 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>
    </>
  );
}
