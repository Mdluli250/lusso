'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';

// Fallback while rates load
const DEFAULT_THRESHOLD = 75000;

export function FreeShippingBar() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.freeShippingThresholdCents) setThreshold(data.freeShippingThresholdCents); })
      .catch(() => {/* keep default */});
  }, []);

  const items = useCartStore((state) => state.items);
  const hasFreeShippingCode = useCartStore((state) =>
    state.appliedDiscounts.some((d) => d.type === 'FREE_SHIPPING')
  );
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const qualifies = subtotal >= threshold || hasFreeShippingCode;
  const progress = qualifies ? 1 : Math.min(subtotal / threshold, 1);
  const remaining = Math.max(threshold - subtotal, 0);

  if (items.length === 0) return null;

  return (
    <div className="mb-6 w-full">
      {qualifies ? (
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          You qualify for free shipping!
        </div>
      ) : (
        <p className="mb-2 text-sm text-[var(--theme-accent)]/70">
          Add <span className="font-semibold text-[var(--theme-accent)]">{formatZAR(remaining)}</span> more for free shipping
        </p>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--theme-accent)]/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${qualifies ? 'bg-emerald-500' : 'bg-[var(--theme-accent)]'}`}
          style={{ width: `${progress * 100}%` }}
          role="progressbar"
          aria-valuenow={subtotal}
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-label={qualifies ? 'Free shipping qualified' : `${formatZAR(remaining)} away from free shipping`}
        />
      </div>
    </div>
  );
}
