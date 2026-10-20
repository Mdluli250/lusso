import type { Metadata } from 'next';
import { CartDrawer } from '@/components/cart/CartDrawer';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review the items in your cart and proceed to checkout.',
  robots: { index: false, follow: false },
};

/**
 * Cart page — Server Component wrapper.
 * CartDrawer is 'use client' and handles all interactive state.
 */
export default function CartPage() {
  return (
    <main className="min-h-screen bg-[var(--theme-bg)]">
      <CartDrawer />
    </main>
  );
}
