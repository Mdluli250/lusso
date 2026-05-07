'use client';

/**
 * CartItem — displays a single cart line item with name, scent, quantity stepper,
 * line total, and a remove button. Dispatches updateQuantity and removeItem to
 * the Zustand cart store.
 *
 * Requirements: 6.3, 6.4
 */

import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-theme-accent/10">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-theme-accent truncate">
          {item.name}
        </h3>
        <p className="text-sm text-theme-accent/60 mt-0.5 capitalize">
          {item.scent}
        </p>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
          aria-label={`Decrease quantity of ${item.name}`}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-theme-accent/20 text-theme-accent hover:bg-theme-accent/10 transition-colors"
        >
          −
        </button>
        <span
          className="w-8 text-center text-sm font-medium text-theme-accent tabular-nums"
          aria-label={`Quantity: ${item.quantity}`}
        >
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
          aria-label={`Increase quantity of ${item.name}`}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-theme-accent/20 text-theme-accent hover:bg-theme-accent/10 transition-colors"
        >
          +
        </button>
      </div>

      {/* Line total */}
      <div className="w-24 text-right">
        <span className="text-sm font-medium text-theme-accent tabular-nums">
          {formatZAR(lineTotal)}
        </span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeItem(item.variantId)}
        aria-label={`Remove ${item.name} from cart`}
        className="w-8 h-8 flex items-center justify-center rounded-md text-theme-accent/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
