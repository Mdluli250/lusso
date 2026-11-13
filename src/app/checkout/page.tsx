'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { createCheckoutSession } from '@/actions/checkout';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import PayFastCheckoutForm from '@/components/checkout/PayFastCheckoutForm';
import { ShippingAddressSummary } from '@/components/checkout/ShippingAddressSummary';
import { formatZAR } from '@/lib/formatCurrency';

/** Max ms to wait for the checkout session before showing an error */
const CHECKOUT_TIMEOUT_MS = 15_000;

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);
  const checkoutStarted = useRef(false);

  const items = useCartStore((state) => state.items);
  const appliedDiscounts = useCartStore((state) => state.appliedDiscounts);
  const giftWrapEnabled = useGiftWrapStore((state) => state.enabled);
  const giftMessage = useGiftWrapStore((state) => state.message);

  // Wait one tick after mount for Zustand to rehydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  const [shippingRate, setShippingRate] = useState(7500);
  const [freeThreshold, setFreeThreshold] = useState(75000);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.standardRateCents) setShippingRate(data.standardRateCents);
        if (data?.freeShippingThresholdCents) setFreeThreshold(data.freeShippingThresholdCents);
      })
      .catch(() => {});
  }, []);

  // Pre-flight: check for a saved delivery address before calling the server action.
  // Uses a timeout so a hanging DB never leaves the page stuck on the spinner.
  useEffect(() => {
    if (!hydrated) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    fetch('/api/profile/address', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        clearTimeout(timer);
        setHasAddress(!!(data?.address));
      })
      .catch(() => {
        clearTimeout(timer);
        // Fail open — let the server action decide, or it will also fail fast
        setHasAddress(true);
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hydrated]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountTotal = appliedDiscounts.reduce((sum, d) => sum + d.discountAmountZAR, 0);
  const hasFreeShipping = appliedDiscounts.some((d) => d.type === 'FREE_SHIPPING');
  const estimatedShipping = subtotal >= freeThreshold || hasFreeShipping ? 0 : shippingRate;
  const estimatedTotal =
    Math.max(subtotal - discountTotal, 0) + estimatedShipping + (giftWrapEnabled ? 4900 : 0);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  // Start checkout once Zustand is hydrated and address check is resolved
  useEffect(() => {
    if (!hydrated) return;
    if (hasAddress === null) return;

    // No address — show inline prompt, don't call server action
    if (hasAddress === false) {
      setLoading(false);
      return;
    }

    async function initCheckout() {
      if (checkoutStarted.current) return;
      checkoutStarted.current = true;

      if (items.length === 0) {
        setError('Your cart is empty. Please add items before checking out.');
        setLoading(false);
        checkoutStarted.current = false;
        return;
      }

      // Race the server action against a timeout so we never hang forever
      let result: Awaited<ReturnType<typeof createCheckoutSession>>;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), CHECKOUT_TIMEOUT_MS)
        );
        result = await Promise.race([
          createCheckoutSession(
            items,
            { enabled: giftWrapEnabled, message: giftMessage },
            appliedDiscounts.length > 0 ? appliedDiscounts : undefined
          ),
          timeoutPromise,
        ]);
      } catch (err) {
        const isTimeout = err instanceof Error && err.message === 'timeout';
        setError(
          isTimeout
            ? 'Checkout is taking too long. Please check your connection and try again.'
            : 'Checkout could not be started. Please try again.'
        );
        setLoading(false);
        checkoutStarted.current = false;
        return;
      }

      if ('error' in result) {
        // Address deleted mid-flight — switch to inline address prompt
        if (result.error.toLowerCase().includes('delivery address')) {
          setHasAddress(false);
          setLoading(false);
          checkoutStarted.current = false;
          return;
        }
        setError(result.error);
        setLoading(false);
        checkoutStarted.current = false;
        return;
      }

      if (!result.checkoutId) {
        // Zero-total order — already PAID, skip PayFast
        router.replace(
          `/success?merchantTransactionId=${encodeURIComponent(result.merchantTransactionId)}`
        );
        return;
      }

      setCheckoutId(result.checkoutId);
      setMerchantTransactionId(result.merchantTransactionId);
      setLoading(false);
      setSessionReady(true);
    }

    initCheckout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hasAddress]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base">Preparing your checkout&hellip;</p>
          <p className="text-sm text-[var(--theme-accent)]/50">This usually takes a few seconds.</p>
        </div>
      </main>
    );
  }

  if (error) {
    const needsSignIn = error.toLowerCase().includes('signed in');
    const isRetryable = !needsSignIn && !error.toLowerCase().includes('empty');

    function handleRetry() {
      setError(null);
      setLoading(true);
      checkoutStarted.current = false;
      setHasAddress(null);
      setHydrated(false);
      setTimeout(() => setHydrated(true), 0);
    }

    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)] px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-xl font-semibold">Checkout Error</h1>
          <p className="text-sm text-[var(--theme-accent)]/70">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            {needsSignIn && (
              <a
                href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout')}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Sign in to continue
              </a>
            )}
            {isRetryable && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Try again
              </button>
            )}
            <a
              href="/cart"
              className="inline-flex items-center justify-center px-6 py-3 border border-[var(--theme-accent)] rounded-lg hover:bg-[var(--theme-accent)]/10 transition-colors text-sm font-medium"
            >
              Return to cart
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-accent)] py-10 px-4 sm:py-14">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold">Complete Your Order</h1>
          <a
            href="/cart"
            className="text-sm text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] underline transition-colors"
          >
            ← Edit cart
          </a>
        </div>

        {/* Shipping address — shown always; prompts to add one if missing */}
        <ShippingAddressSummary
          onAddressAdded={() => {
            setHasAddress(true);
            setLoading(true);
            checkoutStarted.current = false;
          }}
        />

        {/* If no address yet, show a clear CTA and stop here */}
        {hasAddress === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Please add a delivery address above before continuing to payment.
          </div>
        )}

        {/* Gift wrap — only before checkout session is locked */}
        {hasAddress !== false && !sessionReady && <GiftWrapOption />}

        {/* Order cost summary */}
        {hasAddress !== false && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-4 py-4 space-y-2 text-sm sm:px-5">
            <h2 className="font-semibold text-[var(--theme-accent)] mb-3">Order Summary</h2>

            <div className="flex justify-between text-[var(--theme-accent)]/70">
              <span>
                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
              </span>
              <span className="tabular-nums">{formatZAR(subtotal)}</span>
            </div>

            {appliedDiscounts.length > 0 && (
              <div className="space-y-1">
                {appliedDiscounts.map((d) => (
                  <div key={d.code} className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {d.code}
                      </span>
                      <span className="text-xs">
                        {d.type === 'FREE_SHIPPING'
                          ? 'Free shipping'
                          : d.type === 'PERCENTAGE'
                          ? 'Percentage discount'
                          : 'Fixed discount'}
                      </span>
                    </span>
                    {d.type !== 'FREE_SHIPPING' && (
                      <span className="tabular-nums shrink-0">− {formatZAR(d.discountAmountZAR)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-[var(--theme-accent)]/70">
              <span>Shipping</span>
              <span className="tabular-nums">
                {estimatedShipping === 0 ? 'Free' : formatZAR(estimatedShipping)}
              </span>
            </div>

            {giftWrapEnabled && (
              <div className="flex justify-between text-[var(--theme-accent)]/70">
                <span>🎁 Gift wrapping</span>
                <span className="tabular-nums">{formatZAR(4900)}</span>
              </div>
            )}

            <div className="border-t border-[var(--theme-accent)]/10 pt-2 flex justify-between font-semibold text-[var(--theme-accent)]">
              <span>Total (estimated)</span>
              <span className="tabular-nums">{formatZAR(estimatedTotal)}</span>
            </div>
          </div>
        )}

        {/* PayFast payment form — shown once checkout session is ready */}
        {checkoutId && merchantTransactionId && (
          <PayFastCheckoutForm
            uuid={checkoutId}
            merchantTransactionId={merchantTransactionId}
          />
        )}
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import { createCheckoutSession } from '@/actions/checkout';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import PayFastCheckoutForm from '@/components/checkout/PayFastCheckoutForm';
import { ShippingAddressSummary } from '@/components/checkout/ShippingAddressSummary';
import { formatZAR } from '@/lib/formatCurrency';

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  // Tracks whether Zustand has rehydrated from localStorage yet
  const [hydrated, setHydrated] = useState(false);
  // Tracks whether the user has a saved delivery address (pre-flight check)
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);
  const checkoutStarted = useRef(false);

  const items = useCartStore((state) => state.items);
  const appliedDiscounts = useCartStore((state) => state.appliedDiscounts);
  const giftWrapEnabled = useGiftWrapStore((state) => state.enabled);
  const giftMessage = useGiftWrapStore((state) => state.message);

  // Wait one tick after mount for Zustand to rehydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch live shipping rates for the order summary display
  const [shippingRate, setShippingRate] = useState(7500);
  const [freeThreshold, setFreeThreshold] = useState(75000);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.standardRateCents) setShippingRate(data.standardRateCents);
        if (data?.freeShippingThresholdCents) setFreeThreshold(data.freeShippingThresholdCents);
      })
      .catch(() => {});
  }, []);

  // Pre-flight: check whether the user already has a saved delivery address
  // before firing createCheckoutSession. If not, show the inline address prompt
  // instead of an error screen.
  useEffect(() => {
    if (!hydrated) return;
    fetch('/api/profile/address')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setHasAddress(!!(data?.address));
      })
      .catch(() => {
        // Fail open — let the server action decide
        setHasAddress(true);
      });
  }, [hydrated]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountTotal = appliedDiscounts.reduce((sum, d) => sum + d.discountAmountZAR, 0);
  const hasFreeShipping = appliedDiscounts.some((d) => d.type === 'FREE_SHIPPING');
  const estimatedShipping = subtotal >= freeThreshold || hasFreeShipping ? 0 : shippingRate;
  const estimatedTotal =
    Math.max(subtotal - discountTotal, 0) + estimatedShipping + (giftWrapEnabled ? 4900 : 0);
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  // Only start checkout after Zustand has rehydrated AND address check is done
  useEffect(() => {
    if (!hydrated) return;
    // Wait until address pre-flight resolves
    if (hasAddress === null) return;
    // If no address, show the page in "needs address" mode — stop loading, don't call server action
    if (hasAddress === false) {
      setLoading(false);
      return;
    }

    async function initCheckout() {
      if (checkoutStarted.current) return;
      checkoutStarted.current = true;

      if (items.length === 0) {
        setError('Your cart is empty. Please add items before checking out.');
        setLoading(false);
        checkoutStarted.current = false;
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
        checkoutStarted.current = false;
        return;
      }

      if ('error' in result) {
        // If the server also says no address (edge case: address deleted mid-flight),
        // switch to the inline address prompt instead of error screen
        if (result.error.toLowerCase().includes('delivery address')) {
          setHasAddress(false);
          setLoading(false);
          checkoutStarted.current = false;
          return;
        }
        setError(result.error);
        setLoading(false);
        checkoutStarted.current = false;
        return;
      }

      if (!result.checkoutId) {
        // Zero-total order — already PAID, skip PayFast
        router.replace(
          `/success?merchantTransactionId=${encodeURIComponent(result.merchantTransactionId)}`
        );
        return;
      }

      setCheckoutId(result.checkoutId);
      setMerchantTransactionId(result.merchantTransactionId);
      setLoading(false);
      setSessionReady(true);
    }

    initCheckout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hasAddress]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-base">Preparing your checkout&hellip;</p>
        </div>
      </main>
    );
  }

  if (error) {
    const needsSignIn = error.toLowerCase().includes('signed in');
    const isRetryable = !needsSignIn && !error.toLowerCase().includes('empty');

    function handleRetry() {
      setError(null);
      setLoading(true);
      checkoutStarted.current = false;
      setHasAddress(null);
      setHydrated(false);
      setTimeout(() => setHydrated(true), 0);
    }

    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-accent)] px-4">
        <div className="text-center space-y-4 max-w-sm w-full">
          <div className="text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-xl font-semibold">Checkout Error</h1>
          <p className="text-sm text-[var(--theme-accent)]/70">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            {needsSignIn && (
              <a
                href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout')}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Sign in to continue
              </a>
            )}
            {isRetryable && (
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Try again
              </button>
            )}
            <a
              href="/cart"
              className="inline-flex items-center justify-center px-6 py-3 border border-[var(--theme-accent)] rounded-lg hover:bg-[var(--theme-accent)]/10 transition-colors text-sm font-medium"
            >
              Return to cart
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-accent)] py-10 px-4 sm:py-14">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold">Complete Your Order</h1>
          <a
            href="/cart"
            className="text-sm text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] underline transition-colors"
          >
            ← Edit cart
          </a>
        </div>

        {/* Shipping address — shown always; prompts to add one if missing */}
        <ShippingAddressSummary
          onAddressAdded={() => {
            // User just saved an address — re-run the checkout flow
            setHasAddress(true);
            setLoading(true);
            checkoutStarted.current = false;
          }}
        />

        {/* If no address yet, show a clear CTA and stop here */}
        {hasAddress === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Please add a delivery address above before continuing to payment.
          </div>
        )}

        {/* Gift wrap — only before checkout session is locked */}
        {hasAddress !== false && !sessionReady && <GiftWrapOption />}

        {/* Order cost summary */}
        {hasAddress !== false && (
          <div className="rounded-xl border border-[var(--theme-accent)]/15 px-4 py-4 space-y-2 text-sm sm:px-5">
            <h2 className="font-semibold text-[var(--theme-accent)] mb-3">Order Summary</h2>

            <div className="flex justify-between text-[var(--theme-accent)]/70">
              <span>
                Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
              </span>
              <span className="tabular-nums">{formatZAR(subtotal)}</span>
            </div>

            {appliedDiscounts.length > 0 && (
              <div className="space-y-1">
                {appliedDiscounts.map((d) => (
                  <div key={d.code} className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {d.code}
                      </span>
                      <span className="text-xs">
                        {d.type === 'FREE_SHIPPING'
                          ? 'Free shipping'
                          : d.type === 'PERCENTAGE'
                          ? 'Percentage discount'
                          : 'Fixed discount'}
                      </span>
                    </span>
                    {d.type !== 'FREE_SHIPPING' && (
                      <span className="tabular-nums shrink-0">− {formatZAR(d.discountAmountZAR)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-[var(--theme-accent)]/70">
              <span>Shipping</span>
              <span className="tabular-nums">
                {estimatedShipping === 0 ? 'Free' : formatZAR(estimatedShipping)}
              </span>
            </div>

            {giftWrapEnabled && (
              <div className="flex justify-between text-[var(--theme-accent)]/70">
                <span>🎁 Gift wrapping</span>
                <span className="tabular-nums">{formatZAR(4900)}</span>
              </div>
            )}

            <div className="border-t border-[var(--theme-accent)]/10 pt-2 flex justify-between font-semibold text-[var(--theme-accent)]">
              <span>Total (estimated)</span>
              <span className="tabular-nums">{formatZAR(estimatedTotal)}</span>
            </div>
          </div>
        )}

        {/* PayFast payment form — shown once checkout session is ready */}
        {checkoutId && merchantTransactionId && (
          <PayFastCheckoutForm
            uuid={checkoutId}
            merchantTransactionId={merchantTransactionId}
          />
        )}
      </div>
    </main>
  );
}
