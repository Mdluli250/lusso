'use client';

import { useEffect, useRef, useState } from 'react';

// Extend the Window interface so TypeScript knows about the global Checkout object
// injected by the Peach Orchestration checkout.js SDK.
declare global {
  interface Window {
    Checkout?: {
      initiate: (options: PeachCheckoutOptions) => PeachCheckoutInstance;
    };
  }
}

interface PeachCheckoutOptions {
  key: string;
  checkoutId: string;
  options?: {
    theme?: {
      brand?: { primary?: string };
      cards?: { background?: string; backgroundHover?: string };
    };
    ordering?: Record<string, number>;
  };
  events?: {
    onCompleted?: (event: unknown) => void;
    onCancelled?: (event: unknown) => void;
    onExpired?: (event: unknown) => void;
  };
}

interface PeachCheckoutInstance {
  render: (selector: string) => void;
}

interface PeachCheckoutFormProps {
  checkoutId: string;
}

// The Peach checkout.js SDK URL. Sandbox vs live is toggled via env var.
// Sandbox:  https://sandbox-checkout.peachpayments.com/js/checkout.js
// Live:     https://secure.peachpayments.com/js/checkout.js
const CHECKOUT_JS_URL =
  process.env.NEXT_PUBLIC_PEACH_CHECKOUT_JS_URL ||
  'https://sandbox-checkout.peachpayments.com/js/checkout.js';

// The entity ID must be public (it is sent to the client-side SDK, not a secret).
const ENTITY_ID = process.env.NEXT_PUBLIC_PEACH_ENTITY_ID || '';

export default function PeachCheckoutForm({ checkoutId }: PeachCheckoutFormProps) {
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const checkoutRef = useRef<PeachCheckoutInstance | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;

    function initCheckout() {
      if (!window.Checkout) {
        setSdkError('Payment SDK failed to load. Please refresh the page.');
        return;
      }

      try {
        checkoutRef.current = window.Checkout.initiate({
          key: ENTITY_ID,
          checkoutId,
          options: {
            // Match Lusso brand colour (overridden by CSS variable at runtime
            // if needed; this is the primary accent used in the widget).
            theme: {
              brand: { primary: '#b8a99a' },
            },
          },
          events: {
            onCompleted: (event) => {
              console.log('[Peach] Payment completed', event);
              // The SDK redirects automatically to shopperResultUrl on
              // completion; this handler is for any additional client-side work.
            },
            onCancelled: (event) => {
              console.log('[Peach] Payment cancelled', event);
            },
            onExpired: (event) => {
              console.log('[Peach] Checkout expired', event);
              setSdkError('Your payment session has expired. Please return to your cart and try again.');
            },
          },
        });

        checkoutRef.current.render('#peach-payment-form');
      } catch (err) {
        console.error('[Peach] Checkout.initiate failed:', err);
        setSdkError('Could not initialise the payment form. Please try again.');
      }
    }

    // Load the SDK script once, then run initCheckout when it's ready.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_JS_URL}"]`
    );

    if (existing) {
      // Script already in DOM — SDK may already be ready.
      if (window.Checkout) {
        initCheckout();
      } else {
        existing.addEventListener('load', initCheckout, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_JS_URL;
    script.async = true;
    script.addEventListener('load', initCheckout, { once: true });
    script.addEventListener('error', () => {
      setSdkError('Payment SDK failed to load. Please refresh the page.');
    });
    scriptRef.current = script;
    document.body.appendChild(script);

    return () => {
      // Clean up the script if this component unmounts before load completes.
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        scriptRef.current.removeEventListener('load', initCheckout);
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [checkoutId]);

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
    <div className="w-full max-w-lg mx-auto">
      {/*
        The SDK mounts the Embedded Checkout UI into this element.
        Peach requires a minimum height of 640px for the container.
      */}
      <div
        id="peach-payment-form"
        style={{ minHeight: '640px' }}
        aria-label="Secure payment form"
        aria-busy="true"
      />
    </div>
  );
}
