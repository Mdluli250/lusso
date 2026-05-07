'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { Breadcrumb } from './Breadcrumb';

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * AdminShell — layout shell wrapping all /admin pages.
 * Manages sidebar open/close state for mobile, renders sidebar + breadcrumb + main content.
 * Responsive: sidebar collapsed into hamburger menu below 768px.
 *
 * Requirements: 2.1, 2.5
 */
export function AdminShell({ children, user }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const breadcrumbSegments = buildBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with hamburger + breadcrumb */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background border-b border-border md:px-6">
          {/* Hamburger menu — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded text-muted hover:text-foreground"
            aria-label="Open sidebar menu"
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
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Breadcrumb segments={breadcrumbSegments} />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Derive breadcrumb segments from the current pathname.
 * e.g. /admin/products/abc/edit → [Admin, Products, Edit]
 */
function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean); // ['admin', 'products', 'abc', 'edit']

  const segments: { label: string; href?: string }[] = [];

  // Always start with "Admin"
  if (parts.length > 0 && parts[0] === 'admin') {
    segments.push({ label: 'Admin', href: '/admin' });

    // Map known second-level segments
    const sectionMap: Record<string, string> = {
      products: 'Products',
      orders: 'Orders',
      inventory: 'Inventory',
    };

    if (parts.length > 1 && sectionMap[parts[1]]) {
      segments.push({
        label: sectionMap[parts[1]],
        href: `/admin/${parts[1]}`,
      });

      // Handle deeper paths (e.g., /admin/products/new or /admin/products/[id]/edit)
      if (parts.length > 2) {
        const lastPart = parts[parts.length - 1];
        const labelMap: Record<string, string> = {
          new: 'New',
          edit: 'Edit',
        };
        const label = labelMap[lastPart] || lastPart;
        segments.push({ label });
      }
    }
  }

  return segments;
}
