'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { createCheckoutSession } from '@/actions/checkout';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import PayFastCheckoutForm from '@/components/checkout/PayFastCheckoutForm';
import { ShippingAddressSummary } from '@/components/checkout/ShippingAddressSummary';

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const checkoutStarted = useRef(false);

  const items = useCartStore((state) => state.items);
  const appliedDiscounts = useCartStore((state) => state.appliedDiscounts);
  const giftWrapEnabled = useGiftWrapStore((state) => state.enabled);
  const giftMessage = useGiftWrapStore((state) => state.message);

  // Cart summary for display — fetch live shipping rates
  const [shippingRate, setShippingRate] = useState(7500);
  const [freeThreshold, setFreeThreshold] = useState(75000);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.standardRateCents) setShippingRate(data.standardRateCents);
        if (data?.freeShippingThresholdCents) setFreeThreshold(data.freeShippingThresholdCents);
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountTotal = appliedDiscounts.reduce((sum, discount) => sum + discount.discountAmountZAR, 0);
  const hasFreeShipping = appliedDiscounts.some((d) => d.type === 'FREE_SHIPPING');
  const estimatedShipping = subtotal >= freeThreshold || hasFreeShipping ? 0 : shippingRate;
  const estimatedTotal = Math.max(subtotal - discountTotal, 0) + estimatedShipping + (giftWrapEnabled ? 4900 : 0);

  useEffect(() => {
    async function initCheckout() {
      if (checkoutStarted.current) return;
      checkoutStarted.current = true;

      if (items.length === 0) {
        setError('Your cart is empty. Please add items before checking out.');
        setLoading(false);
        return;
      }

      let result: Awaited<ReturnType<typeof createCheckoutSession>>;
      try {
        result = await createCheckoutSession(
          items,
          { enabled: giftWrapEnabled, message: giftMessage },
          appliedDiscounts.length > 0 ? appliedDiscounts : undefined
        );
      } catch (checkoutError) {
        console.error('Checkout initialization failed:', checkoutError);
        setError('Checkout could not be started. Please try again.');
        setLoading(false);
        return;
      }

      if ('error' in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (!result.checkoutId) {
        router.replace(
          `/success?merchantTransactionId=${encodeURIComponent(result.merchantTransactionId)}`
        );
        return;
      }

      setCheckoutId(result.checkoutId);
      setMerchantTransactionId(result.merchantTransactionId);
      setLoading(false);
    }

    initCheckout();
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
    const needsAddress = error.toLowerCase().includes('delivery address');
    const needsSignIn = error.toLowerCase().includes('signed in');
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-2xl font-semibold">Checkout Error</h1>
          <p className="text-[var(--theme-accent)]/70">{error}</p>
          <div className="flex gap-3 justify-center flex-wrap mt-4">
            {needsSignIn && (
              <a
                href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout')}`}
                className="inline-block px-6 py-3 bg-[var(--theme-accent)] text-cream rounded-md hover:opacity-90 transition-opacity"
              >
                Sign in to continue
              </a>
            )}
            {needsAddress && (
              <a
                href="/dashboard/settings"
                className="inline-block px-6 py-3 bg-[var(--theme-accent)] text-cream rounded-md hover:opacity-90 transition-opacity"
              >
                Add delivery address
              </a>
            )}
            <a
              href="/cart"
              className="inline-block px-6 py-3 border border-[var(--theme-accent)] rounded-md hover:bg-[var(--theme-accent)]/10 transition-colors"
            >
              Return to cart
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-accent)] py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-center">Complete Your Order</h1>

        {/* Shipping address card */}
        <ShippingAddressSummary />

        {/* Order cost summary */}
        <div className="rounded-xl border border-[var(--theme-accent)]/15 px-5 py-4 space-y-2 text-sm">
          <h2 className="font-semibold text-[var(--theme-accent)] mb-3">Order Summary</h2>
          <div className="flex justify-between text-[var(--theme-accent)]/70">
            <span>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} item{items.reduce((n, i) => n + i.quantity, 0) !== 1 ? 's' : ''})</span>
            <span>R{(subtotal / 100).toFixed(2)}</span>
          </div>

          {/* Applied discounts */}
          {appliedDiscounts.length > 0 && (
            <div className="space-y-1">
              {appliedDiscounts.map((d) => (
                <div key={d.code} className="flex justify-between text-green-400">
                  <span className="flex items-center gap-1">
                    <span className="text-xs font-mono bg-green-500/10 px-1.5 py-0.5 rounded">{d.code}</span>
                    <span className="text-xs">
                      {d.type === 'FREE_SHIPPING' ? 'Free shipping' : d.type === 'PERCENTAGE' ? 'Percentage discount' : 'Fixed amount discount'}
                    </span>
                  </span>
                  <span>-R{(d.discountAmountZAR / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between text-[var(--theme-accent)]/70">
            <span>Shipping</span>
            <span>{estimatedShipping === 0 ? 'Free' : `R${(estimatedShipping / 100).toFixed(2)}`}</span>
          </div>
          {giftWrapEnabled && (
            <div className="flex justify-between text-[var(--theme-accent)]/70">
              <span>Gift wrapping</span>
              <span>R49.00</span>
            </div>
          )}
          <div className="border-t border-[var(--theme-accent)]/10 pt-2 flex justify-between font-semibold text-[var(--theme-accent)]">
            <span>Total (estimated)</span>
            <span>R{(estimatedTotal / 100).toFixed(2)}</span>
          </div>
        </div>

        <GiftWrapOption />

        {checkoutId && merchantTransactionId && (
          <PayFastCheckoutForm uuid={checkoutId} merchantTransactionId={merchantTransactionId} />
        )}
      </div>
    </main>
  );
}
