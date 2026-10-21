'use client';

/**
 * CartSummary — accurate order summary that reflects:
 *   - Subtotal
 *   - Applied discount codes (each deduction itemised)
 *   - Gift wrap fee (+R49 when enabled)
 *   - Final total
 *   - "Proceed to Checkout" button (disabled when cart is empty)
 *
 * Requirements: 6.5, 6.6
 */

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';

const GIFT_WRAP_COST_CENTS = 4900; // R49.00

export function CartSummary() {
  const items = useCartStore((s) => s.items);
  const appliedDiscounts = useCartStore((s) => s.appliedDiscounts);
  const giftWrapEnabled = useGiftWrapStore((s) => s.enabled);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const freeShippingCode = appliedDiscounts.some((discount) => discount.type === 'FREE_SHIPPING');
  const shipping = subtotalCents >= 75000 || freeShippingCode ? 0 : 7500;

  const totalDiscountCents = appliedDiscounts.reduce(
    (sum, d) => sum + d.discountAmountZAR,
    0
  );

  const giftWrapCents = giftWrapEnabled ? GIFT_WRAP_COST_CENTS : 0;

  // Total: subtotal − discounts (floor at 0) + gift wrap
  const finalTotal =
    Math.max(subtotalCents - totalDiscountCents, 0) + giftWrapCents;

  const hasDiscounts = appliedDiscounts.length > 0;
  const showBreakdown = hasDiscounts || giftWrapEnabled || shipping > 0;
  const isEmpty = totalItems === 0;

  return (
    <div className="rounded-xl border border-[var(--theme-accent)]/10 p-6 bg-[var(--theme-accent)]/5">
      <h2 className="text-lg font-semibold text-[var(--theme-accent)] mb-4">
        Order Summary
      </h2>

      <div className="space-y-2 mb-6">
        {/* Subtotal row — always shown */}
        <div className="flex justify-between text-sm text-[var(--theme-accent)]/70">
          <span>
            {totalItems === 1
              ? '1 item'
              : `${totalItems} items`}
          </span>
          <span className="tabular-nums">{formatZAR(subtotalCents)}</span>
        </div>

        <div className="flex justify-between text-sm text-[var(--theme-accent)]/70">
          <span>Shipping</span>
          <span className="tabular-nums">{shipping === 0 ? 'Free' : formatZAR(shipping)}</span>
        </div>

        {/* Per-discount deduction rows */}
        {hasDiscounts &&
          appliedDiscounts.map((discount) => (
            <div
              key={discount.codeId}
              className="flex justify-between text-sm text-emerald-600"
            >
              <span className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                  {discount.code}
                </span>
                Discount
              </span>
              <span className="tabular-nums">
                − {formatZAR(discount.discountAmountZAR)}
              </span>
            </div>
          ))}

        {/* Gift wrap row */}
        {giftWrapEnabled && (
          <div className="flex justify-between text-sm text-[var(--theme-accent)]/70">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true">🎁</span>
              Gift wrapping
            </span>
            <span className="tabular-nums">+ {formatZAR(GIFT_WRAP_COST_CENTS)}</span>
          </div>
        )}

        {/* Divider + final total — only when there's a breakdown to show */}
        {showBreakdown && (
          <div className="border-t border-[var(--theme-accent)]/10 pt-2 mt-2">
            <div className="flex justify-between text-base font-semibold text-[var(--theme-accent)]">
              <span>Total</span>
              <span className="tabular-nums">{formatZAR(finalTotal + shipping)}</span>
            </div>
          </div>
        )}

        {!showBreakdown && (
          <div className="flex justify-between text-base font-semibold text-[var(--theme-accent)]">
            <span>Total</span>
            <span className="tabular-nums">{formatZAR(finalTotal + shipping)}</span>
          </div>
        )}
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
