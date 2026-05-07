'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { createCheckoutSession } from '@/actions/checkout';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import PeachCheckoutForm from '@/components/checkout/PeachCheckoutForm';

export default function CheckoutPage() {
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const items = useCartStore((state) => state.items);
  const giftWrapEnabled = useGiftWrapStore((state) => state.enabled);
  const giftMessage = useGiftWrapStore((state) => state.message);

  useEffect(() => {
    async function initCheckout() {
      if (items.length === 0) {
        setError('Your cart is empty. Please add items before checking out.');
        setLoading(false);
        return;
      }

      const result = await createCheckoutSession(items, {
        enabled: giftWrapEnabled,
        message: giftMessage,
      });

      if ('error' in result) {
        setError(result.error);
      } else {
        setCheckoutId(result.checkoutId);
      }

      setLoading(false);
    }

    initCheckout();
    // Only run once on mount — items are read from the store at that point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg">Preparing your checkout&hellip;</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-2xl font-semibold">Checkout Error</h1>
          <p className="text-[var(--theme-accent)]/70">{error}</p>
          <a
            href="/cart"
            className="inline-block mt-4 px-6 py-3 border border-[var(--theme-accent)] rounded-md hover:bg-[var(--theme-accent)]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            Return to Cart
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-accent)] py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-center">Complete Your Payment</h1>
        <p className="text-center text-[var(--theme-accent)]/70">
          Enter your payment details below to complete your order.
        </p>
        <GiftWrapOption />
        {checkoutId && <PeachCheckoutForm checkoutId={checkoutId} />}
      </div>
    </main>
  );
}
