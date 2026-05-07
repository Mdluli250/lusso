'use client';

/**
 * CartDrawer — renders the full cart view with all CartItem components and
 * a CartSummary. Used as the content for the /cart page.
 *
 * Requirements: 6.1, 6.2
 */

import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { FreeShippingBar } from './FreeShippingBar';
import Link from 'next/link';

export function CartDrawer() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-theme-accent mb-6">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-theme-accent/60 text-lg mb-4">
            Your cart is empty
          </p>
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 text-theme-accent underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Browse the collection
          </Link>
        </div>
      ) : (
        <>
          <FreeShippingBar />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items list */}
            <div className="lg:col-span-2">
              <div className="divide-y divide-theme-accent/10">
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>
            </div>

            {/* Summary sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
