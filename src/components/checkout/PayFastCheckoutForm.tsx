'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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

// PayFast Onsite engine script URL — set via env to switch sandbox ↔ live.
const ENGINE_JS_URL =
  process.env.NEXT_PUBLIC_PAYFAST_ENGINE_JS_URL ||
  'https://sandbox.payfast.co.za/onsite/engine.js';

export default function PayFastCheckoutForm({ uuid, merchantTransactionId }: PayFastCheckoutFormProps) {
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [launched, setLaunched] = useState(false);
  // Ref tracks the script element we injected so cleanup is scoped correctly.
  const injectedScriptRef = useRef<HTMLScriptElement | null>(null);

  // ── Load the PayFast engine script ────────────────────────────────────────
  // The effect key is `uuid`, not `ENGINE_JS_URL`. Each new checkout session
  // gets a fresh UUID; we re-run only when that changes. We do NOT remove and
  // re-add the script on every render — once the script is in the DOM and the
  // global is set we just mark ready.
  useEffect(() => {
    if (!uuid) return;

    setSdkError(null);
    setSdkReady(false);
    setLaunched(false);

    // If the global is already available (e.g. HMR, second mount) skip loading.
    if (window.payfast_do_onsite_payment) {
      setSdkReady(true);
      return;
    }

    // Reuse any script tag that another component/render already inserted.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${ENGINE_JS_URL}"]`
    );
    if (existing) {
      // Script is in the DOM but hasn't finished loading yet — wait for it.
      const onLoad = () => {
        if (window.payfast_do_onsite_payment) {
          setSdkReady(true);
        } else {
          setSdkError('Payment SDK failed to initialize. Please refresh the page.');
        }
      };
      existing.addEventListener('load', onLoad, { once: true });
      return () => existing.removeEventListener('load', onLoad);
    }

    // Inject a fresh script tag.
    const script = document.createElement('script');
    script.src = ENGINE_JS_URL;
    script.async = true;
    injectedScriptRef.current = script;

    script.addEventListener('load', () => {
      if (window.payfast_do_onsite_payment) {
        setSdkReady(true);
      } else {
        setSdkError('Payment SDK failed to initialize. Please refresh the page.');
      }
    }, { once: true });

    script.addEventListener('error', () => {
      setSdkError('Payment SDK failed to load. Please check your connection and refresh.');
    }, { once: true });

    document.body.appendChild(script);

    // Cleanup: only remove the script we injected (not one that was already there).
    return () => {
      const s = injectedScriptRef.current;
      if (s && document.body.contains(s)) {
        document.body.removeChild(s);
        injectedScriptRef.current = null;
      }
    };
  // uuid is intentionally the only dep — the script URL never changes at runtime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  // ── Launch PayFast popup ──────────────────────────────────────────────────
  const launchPayment = useCallback(() => {
    if (!window.payfast_do_onsite_payment) {
      setSdkError('Payment SDK is not ready. Please refresh the page.');
      return;
    }

    setLaunched(true);

    window.payfast_do_onsite_payment({ uuid }, (result) => {
      if (result) {
        // Payment confirmed — navigate to the success/polling page.
        // The ITN updates the order asynchronously; SuccessClient polls until settled.
        window.location.href = `/success?merchantTransactionId=${encodeURIComponent(merchantTransactionId)}`;
      } else {
        // User closed the popup or payment was declined — allow retry.
        setLaunched(false);
      }
    });
  }, [uuid, merchantTransactionId]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (sdkError) {
    return (
      <div
        role="alert"
        className="w-full rounded-xl border border-red-200 bg-red-50 p-5 text-center space-y-3"
      >
        <div className="text-2xl" aria-hidden="true">⚠️</div>
        <p className="font-medium text-red-700">Payment unavailable</p>
        <p className="text-sm text-red-600">{sdkError}</p>
        <a
          href="/cart"
          className="inline-flex items-center justify-center mt-1 px-5 py-2.5 text-sm font-medium border border-red-300 rounded-lg text-red-700 hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Return to Cart
        </a>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!sdkReady) {
    return (
      <div className="w-full rounded-xl border border-[var(--theme-accent)]/15 p-6 flex flex-col items-center gap-3 text-[var(--theme-accent)]/70">
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-sm">Loading secure payment&hellip;</p>
      </div>
    );
  }

  // ── Launched / waiting state ──────────────────────────────────────────────
  if (launched) {
    return (
      <div className="w-full rounded-xl border border-[var(--theme-accent)]/15 p-5 text-center space-y-4">
        <div className="w-6 h-6 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm text-[var(--theme-accent)]/70">
          Complete your payment in the PayFast window.
        </p>
        {/* Reopen correctly re-calls launchPayment rather than just toggling state */}
        <button
          type="button"
          onClick={launchPayment}
          className="text-xs text-[var(--theme-accent)]/60 underline hover:text-[var(--theme-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
        >
          Reopen payment window
        </button>
        <div>
          <a
            href="/cart"
            className="text-xs text-[var(--theme-accent)]/40 hover:text-[var(--theme-accent)]/70 underline transition-colors"
          >
            Cancel and return to cart
          </a>
        </div>
      </div>
    );
  }

  // ── Ready to pay state ────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-xl border border-[var(--theme-accent)]/15 p-5 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-[var(--theme-accent)]/50 text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true">
          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
        </svg>
        <span>Secured by PayFast · 256-bit SSL encryption</span>
      </div>

      <button
        type="button"
        onClick={launchPayment}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-accent)] px-6 py-4 text-base font-semibold text-[var(--theme-bg)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-offset-2 min-h-[52px]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        Pay securely with PayFast
      </button>

      <a
        href="/cart"
        className="text-xs text-[var(--theme-accent)]/40 hover:text-[var(--theme-accent)]/70 underline transition-colors"
      >
        Cancel and return to cart
      </a>
    </div>
  );
}
