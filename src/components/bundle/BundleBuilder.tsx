'use client';

/**
 * BundleBuilder — displays 3 bundle slots with discount calculation and add-to-cart.
 *
 * Shows filled/empty slots, remaining count, 15% discount when complete,
 * and an "Add Bundle to Cart" button.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { useBundleStore, calculateBundleDiscount } from '@/store/bundleStore';
import { BundleSlot } from './BundleSlot';
import { Button } from '@/components/ui/Button';
import { formatZAR } from '@/lib/formatCurrency';

export function BundleBuilder() {
  const items = useBundleStore((s) => s.items);
  const removeItem = useBundleStore((s) => s.removeItem);
  const clear = useBundleStore((s) => s.clear);
  const addToCart = useBundleStore((s) => s.addToCart);

  const isComplete = items.length === 3;
  const { totalPrice, discountAmount, discountedPrice } = calculateBundleDiscount(items);
  const remainingSlots = 3 - items.length;

  // Pad items to always show 3 slots
  const slots = [...items, ...Array(remainingSlots).fill(null)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--theme-accent)]">
          Your Bundle
        </h2>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)] transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-3">
        {slots.map((item, i) => (
          <BundleSlot
            key={item?.productId ?? `empty-${i}`}
            item={item}
            index={i}
            onRemove={item ? removeItem : undefined}
          />
        ))}
      </div>

      {/* Status */}
      {!isComplete && (
        <p className="text-sm text-[var(--theme-accent)]/60 text-center">
          Add {remainingSlots} more candle{remainingSlots !== 1 ? 's' : ''} to complete your bundle and save 15%!
        </p>
      )}

      {/* Discount calculation */}
      {isComplete && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 space-y-2">
          <div className="flex justify-between text-sm text-[var(--theme-accent)]/70">
            <span>Subtotal</span>
            <span>{formatZAR(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-500 font-medium">
            <span>Bundle Discount (15%)</span>
            <span>-{formatZAR(discountAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[var(--theme-accent)] pt-2 border-t border-[var(--theme-accent)]/10">
            <span>Total</span>
            <span>{formatZAR(discountedPrice)}</span>
          </div>
        </div>
      )}

      {/* Add to cart */}
      <Button
        variant="primary"
        size="md"
        fullWidth
        disabled={!isComplete}
        onClick={addToCart}
      >
        {isComplete ? 'Add Bundle to Cart' : `Select ${remainingSlots} more to complete`}
      </Button>
    </div>
  );
}
