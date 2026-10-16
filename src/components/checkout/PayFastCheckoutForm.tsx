'use client';

import { useEffect, useRef, useState } from 'react';

// Extend Window so TypeScript knows about the PayFast Onsite engine global.
declare global {
  interface Window {
    payfast_do_onsite_payment?: (
      options: PayFastOnsiteOptions,
      callback?: (result: boolean) => void
    ) => void;
  }
}

interface PayFastOnsiteOptions {
  uuid: string;
  return_url?: string;
  cancel_url?: string;
}

interface PayFastCheckoutFormProps {
  /** One-time UUID returned by PayFast /onsite/process */
  uuid: string;
  /** merchantTransactionId used to build the success URL after payment */
  merchantTransactionId: string;
}

// PayFast Onsite engine script.
// Sandbox: https://sandbox.payfast.co.za/onsite/engine.js
// Live:    https://www.payfast.co.za/onsite/engine.js
const ENGINE_JS_URL =
  process.env.NEXT_PUBLIC_PAYFAST_ENGINE_JS_URL ||
  'https://sandbox.payfast.co.za/onsite/engine.js';

export default function PayFastCheckoutForm({ uuid, merchantTransactionId }: PayFastCheckoutFormProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!uuid) return;

    function launchPayment() {
      if (!window.payfast_do_onsite_payment) {
        setSdkError('Payment SDK failed to load. Please refresh the page.');
        return;
      }

      if (launched) return; // guard against double-launch
      setLaunched(true);

      window.payfast_do_onsite_payment({ uuid }, (result) => {
        if (result) {
          // Payment completed — redirect to success page immediately.
          // The ITN will arrive asynchronously and flip the order from PENDING → PAID;
          // SuccessClient polls until that happens.
          window.location.href = `/success?merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`;
        } else {
          // User closed the modal without paying
          console.log('[PayFast] Payment modal closed without payment');
          setLaunched(false); // allow them to try again
        }
      });
    }

    // If the engine script is already in the DOM (e.g. HMR), reuse it.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${ENGINE_JS_URL}"]`
    );

    if (existing) {
      if (window.payfast_do_onsite_payment) {
        launchPayment();
      } else {
        existing.addEventListener('load', launchPayment, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = ENGINE_JS_URL;
    script.async = true;
    script.addEventListener('load', launchPayment, { once: true });
    script.addEventListener('error', () => {
      setSdkError('Payment SDK failed to load. Please refresh the page.');
    });
    scriptRef.current = script;
    document.body.appendChild(script);

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        scriptRef.current.removeEventListener('load', launchPayment);
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  if (sdkError) {
    return (
      <div
        role="alert"
        className="w-full max-w-lg mx-auto p-6 rounded-lg border border-red-300 bg-red-50 text-red-700 text-center space-y-3"
      >
        <p className="font-medium">Payment unavailable</p>
        <p className="text-sm">{sdkError}</p>
        <a
          href="/cart"
          className="inline-block mt-2 px-4 py-2 text-sm border border-red-400 rounded-md hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Return to Cart
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
      {/* Loading indicator shown while the modal is opening */}
      {!launched && (
        <div className="flex flex-col items-center gap-3 text-[var(--theme-accent)]/70">
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Opening secure payment window&hellip;</p>
        </div>
      )}

      {launched && (
        <p className="text-sm text-[var(--theme-accent)]/70 text-center">
          Complete your payment in the PayFast window. If it did not open,{' '}
          <button
            type="button"
            onClick={() => setLaunched(false)}
            className="underline hover:text-[var(--theme-accent)] transition-colors"
          >
            click here to retry
          </button>
          .
        </p>
      )}

      <a
        href="/cart"
        className="text-xs text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)]/80 underline transition-colors"
      >
        Cancel and return to cart
      </a>
    </div>
  );
}
