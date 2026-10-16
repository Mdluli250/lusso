'use client';

/**
 * CartDrawer — full-page cart view at /cart.
 *
 * Layout: two-column on lg+
 *   Left (2/3):  FreeShippingBar, item list, CartUpsell
 *   Right (1/3): sticky sidebar — GiftWrapOption, PromoCodeInput, CartSummary
 *
 * Requirements: 6.1, 6.2
 */

import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartUpsell } from './CartUpsell';
import { FreeShippingBar } from './FreeShippingBar';
import { PromoCodeInput } from './PromoCodeInput';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import { EmptyState } from '@/components/ui/EmptyState';

export function CartDrawer() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--theme-accent)] mb-6">
        Shopping Cart
      </h1>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is waiting"
          description="Fill it with warmth — browse our hand-poured candle collection."
          action={{ label: 'Browse Collection', href: '/collection' }}
        />
      ) : (
        <>
          <FreeShippingBar />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: items + upsell ── */}
            <div className="lg:col-span-2 space-y-2">
              <div className="divide-y divide-[var(--theme-accent)]/10">
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>
              <CartUpsell />
            </div>

            {/* ── Right: sticky sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <GiftWrapOption />
                <PromoCodeInput />
                <CartSummary />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
