'use client';

/**
 * CartSummary — accurate order summary that reflects:
 *   - Subtotal
 *   - Live shipping rate (fetched from /api/shipping-rates)
 *   - Applied discount codes (each deduction itemised)
 *   - Gift wrap fee (+R49 when enabled)
 *   - Final total
 *   - "Proceed to Checkout" button (disabled when cart is empty)
 *
 * Requirements: 6.5, 6.6
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';

const GIFT_WRAP_COST_CENTS = 4900; // R49.00
const DEFAULT_SHIPPING_RATE = 7500;
const DEFAULT_FREE_THRESHOLD = 75000;

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const appliedDiscounts = useCartStore((s) => s.appliedDiscounts);
  const giftWrapEnabled = useGiftWrapStore((s) => s.enabled);

  // Live shipping rates — fall back to defaults while loading
  const [shippingRate, setShippingRate] = useState(DEFAULT_SHIPPING_RATE);
  const [freeThreshold, setFreeThreshold] = useState(DEFAULT_FREE_THRESHOLD);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.standardRateCents) setShippingRate(data.standardRateCents);
        if (data?.freeShippingThresholdCents) setFreeThreshold(data.freeShippingThresholdCents);
      })
      .catch(() => {/* keep defaults */});
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasFreeShippingCode = appliedDiscounts.some((d) => d.type === 'FREE_SHIPPING');
  const shippingCents = subtotalCents >= freeThreshold || hasFreeShippingCode ? 0 : shippingRate;

  const totalDiscountCents = appliedDiscounts.reduce(
    (sum, d) => sum + d.discountAmountZAR,
    0
  );

  const giftWrapCents = giftWrapEnabled ? GIFT_WRAP_COST_CENTS : 0;

  // Total: subtotal − discounts (floor at 0) + shipping + gift wrap
  const finalTotal =
    Math.max(subtotalCents - totalDiscountCents, 0) + shippingCents + giftWrapCents;

  const hasDiscounts = appliedDiscounts.length > 0;
  const isEmpty = totalItems === 0;

  return (
    <div className="rounded-xl border border-[var(--theme-accent)]/10 p-5 lg:p-6 bg-[var(--theme-accent)]/5">
      <h2 className="text-base font-semibold text-[var(--theme-accent)] mb-4">
        Order Summary
      </h2>

      <div className="space-y-2.5 mb-5 text-sm">
        {/* Subtotal */}
        <div className="flex justify-between text-[var(--theme-accent)]/70">
          <span>{totalItems === 1 ? '1 item' : `${totalItems} items`}</span>
          <span className="tabular-nums">{formatZAR(subtotalCents)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-[var(--theme-accent)]/70">
          <span>Shipping</span>
          <span className="tabular-nums">{shippingCents === 0 ? 'Free' : formatZAR(shippingCents)}</span>
        </div>

        {/* Per-discount rows */}
        {hasDiscounts && appliedDiscounts.map((discount) => (
          <div key={discount.codeId} className="flex justify-between text-emerald-600">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                {discount.code}
              </span>
              <span className="text-xs">
                {discount.type === 'FREE_SHIPPING' ? 'Free shipping' : 'Discount'}
              </span>
            </span>
            {discount.type !== 'FREE_SHIPPING' && (
              <span className="tabular-nums shrink-0">− {formatZAR(discount.discountAmountZAR)}</span>
            )}
          </div>
        ))}

        {/* Gift wrap */}
        {giftWrapEnabled && (
          <div className="flex justify-between text-[var(--theme-accent)]/70">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true">🎁</span>
              Gift wrapping
            </span>
            <span className="tabular-nums">+ {formatZAR(GIFT_WRAP_COST_CENTS)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-[var(--theme-accent)]/10 pt-2.5 mt-1 flex justify-between font-semibold text-[var(--theme-accent)]">
          <span>Total</span>
          <span className="tabular-nums">{formatZAR(finalTotal)}</span>
        </div>
      </div>

      {isEmpty ? (
        <p className="text-sm text-[var(--theme-accent)]/50 text-center py-2">
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
