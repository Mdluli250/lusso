'use client';

/**
 * FreeShippingBar — shows progress toward free shipping threshold.
 * Displays a progress bar and encouraging message.
 */

import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';

const FREE_SHIPPING_THRESHOLD = 75000; // R750.00 in cents

export function FreeShippingBar() {
  const items = useCartStore((s) => s.items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) return null;

  const progress = Math.min(subtotal / FREE_SHIPPING_THRESHOLD, 1);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const qualified = remaining <= 0;

  return (
    <div className="w-full mb-6">
      {qualified ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          You qualify for free shipping!
        </div>
      ) : (
        <p className="text-sm text-[var(--theme-accent)]/70 mb-2">
          Add <span className="font-semibold text-[var(--theme-accent)]">{formatZAR(remaining)}</span> more for free shipping
        </p>
      )}
      <div className="w-full h-2 rounded-full bg-[var(--theme-accent)]/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            qualified ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'
          }`}
          style={{ width: `${progress * 100}%` }}
          role="progressbar"
          aria-valuenow={subtotal}
          aria-valuemin={0}
          aria-valuemax={FREE_SHIPPING_THRESHOLD}
          aria-label={qualified ? 'Free shipping qualified' : `${formatZAR(remaining)} away from free shipping`}
        />
      </div>
    </div>
  );
}
