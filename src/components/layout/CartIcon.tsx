'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

/**
 * Cart icon with item-count badge.
 * Reads `totalItems` from the Zustand cart store.
 * Badge is hidden when the cart is empty (Requirement 6.2).
 */
export default function CartIcon() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      aria-label={totalItems > 0 ? `Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}` : 'Cart'}
      className={[
        'relative inline-flex items-center justify-center',
        'rounded-lg p-2',
        'text-[var(--theme-accent)] transition-colors duration-150',
        'hover:bg-white/10',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--theme-accent)]',
      ].join(' ')}
    >
      {/* Shopping bag icon */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>

      {/* Badge — only rendered when cart has items */}
      {totalItems > 0 && (
        <span
          aria-hidden="true"
          className={[
            'absolute -right-1 -top-1',
            'flex h-5 w-5 items-center justify-center',
            'rounded-full bg-[var(--theme-accent)] text-[var(--theme-bg)]',
            'text-[10px] font-bold leading-none',
          ].join(' ')}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
}
