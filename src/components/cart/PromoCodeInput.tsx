'use client';

/**
 * PromoCodeInput — renders a promo code input field with Apply/Remove
 * functionality in the cart drawer order summary section.
 *
 * Supports multiple applied codes (when stackable). The order total is
 * rendered by CartSummary — this component only shows applied codes.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8
 */

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { applyPromoCode } from '@/actions/discounts';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import type { CartItemForDiscount } from '@/lib/discounts/types';

export function PromoCodeInput() {
  const items = useCartStore((s) => s.items);
  const appliedDiscounts = useCartStore((s) => s.appliedDiscounts);
  const addDiscount = useCartStore((s) => s.addDiscount);
  const removeDiscount = useCartStore((s) => s.removeDiscount);

  const [codeInput, setCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function handleApply() {
    if (!codeInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const cartItems: CartItemForDiscount[] = items.map((item) => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    }));

    try {
      const result = await applyPromoCode(
        codeInput.trim(),
        cartItems,
        appliedDiscounts
      );

      if (result.valid) {
        addDiscount(result.discount);
        setCodeInput('');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemove(codeId: string) {
    removeDiscount(codeId);
  }

  return (
    <div className="space-y-3">
      {/* Promo code input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply();
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--theme-accent)]/20 bg-transparent text-[var(--theme-accent)] placeholder:text-[var(--theme-accent)]/40 focus:outline-none focus:border-[var(--theme-accent)]/50"
          disabled={isLoading}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleApply}
          disabled={isLoading || !codeInput.trim()}
        >
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* Applied discounts list */}
      {appliedDiscounts.length > 0 && (
        <div className="space-y-2">
          {appliedDiscounts.map((discount) => (
            <div
              key={discount.codeId}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] font-medium text-xs uppercase">
                  {discount.code}
                </span>
                <span className="text-green-600">
                  {discount.type === 'FREE_SHIPPING' ? 'Free shipping' : `− ${formatZAR(discount.discountAmountZAR)}`}
                </span>
              </div>
              <button
                onClick={() => handleRemove(discount.codeId)}
                className="text-xs text-[var(--theme-accent)]/50 hover:text-red-500 transition-colors"
                aria-label={`Remove code ${discount.code}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
