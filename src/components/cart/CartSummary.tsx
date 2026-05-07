'use client';

/**
 * CartSummary — displays total item count and total amount formatted in ZAR.
 * Renders a "Proceed to Checkout" button that is disabled when the cart is empty.
 *
 * Requirements: 6.5, 6.6
 */

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const isEmpty = totalItems === 0;

  return (
    <div className="rounded-xl border border-theme-accent/10 p-6 bg-theme-accent/5">
      <h2 className="text-lg font-semibold text-theme-accent mb-4">
        Order Summary
      </h2>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm text-theme-accent/70">
          <span>Items</span>
          <span className="tabular-nums">{totalItems}</span>
        </div>
        <div className="flex justify-between text-base font-medium text-theme-accent">
          <span>Total</span>
          <span className="tabular-nums">{formatZAR(totalAmountCents)}</span>
        </div>
      </div>

      {isEmpty ? (
        <p className="text-sm text-theme-accent/50 text-center py-2">
          Your cart is empty
        </p>
      ) : (
        <Link href="/checkout">
          <Button variant="primary" fullWidth>
            Proceed to Checkout
          </Button>
        </Link>
      )}
    </div>
  );
}
