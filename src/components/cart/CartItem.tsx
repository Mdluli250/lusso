'use client';

/**
 * CartItem — displays a single cart line item with:
 *   - Product image thumbnail
 *   - Name, scent, unit price
 *   - Quantity stepper
 *   - Line total
 *   - Remove button
 *
 * Requirements: 6.3, 6.4
 */

import Image from 'next/image';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [imgError, setImgError] = useState(false);

  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[var(--theme-accent)]/10">
      {/* Product thumbnail */}
      <div className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/10">
        {item.imageUrl && !imgError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback: simple candle silhouette */
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="28"
              height="38"
              viewBox="0 0 28 38"
              fill="none"
              aria-hidden="true"
            >
              <ellipse cx="14" cy="4" rx="2.5" ry="3.5" fill="currentColor" opacity="0.35" />
              <line x1="14" y1="7.5" x2="14" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <rect x="5" y="11" width="18" height="24" rx="3" fill="currentColor" opacity="0.15" />
              <rect x="5" y="11" width="18" height="24" rx="3" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-[var(--theme-accent)] truncate leading-tight">
          {item.name}
        </h3>
        <p className="text-xs text-[var(--theme-accent)]/55 mt-0.5 capitalize">
          {item.scent}
        </p>
        {/* Unit price */}
        <p className="text-xs text-[var(--theme-accent)]/60 mt-1 tabular-nums">
          {formatZAR(item.price)} each
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
          aria-label={`Decrease quantity of ${item.name}`}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors text-sm leading-none"
        >
          −
        </button>
        <span
          className="w-7 text-center text-sm font-medium text-[var(--theme-accent)] tabular-nums"
          aria-label={`Quantity: ${item.quantity}`}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
          aria-label={`Increase quantity of ${item.name}`}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-[var(--theme-accent)]/20 text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors text-sm leading-none"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <div className="w-20 text-right shrink-0">
        <span className="text-sm font-semibold text-[var(--theme-accent)] tabular-nums">
          {formatZAR(lineTotal)}
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeItem(item.variantId)}
        aria-label={`Remove ${item.name} from cart`}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[var(--theme-accent)]/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
