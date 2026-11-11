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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-accent)] mb-5">
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

          {/* Mobile: stacked. Desktop: side-by-side */}
          <div className="mt-4 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* ── Items + upsell ── */}
            <div className="w-full lg:flex-1 space-y-1">
              <div className="divide-y divide-[var(--theme-accent)]/10">
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>
              <CartUpsell />
            </div>

            {/* ── Sidebar: gift wrap + promo + summary ── */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-4">
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
