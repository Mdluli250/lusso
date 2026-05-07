'use client';

/**
 * Cart page — Client Component rendering the CartDrawer as a full page.
 *
 * Requirements: 6.1
 */

import { CartDrawer } from '@/components/cart/CartDrawer';

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[var(--theme-bg)]">
      <CartDrawer />
    </main>
  );
}
