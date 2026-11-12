'use client';

/**
 * SuccessClient — Client Component island for the Success page.
 *
 * Responsibilities:
 * - Clears the Zustand cart on mount
 * - Polls /api/orders/[merchantTransactionId]/status until the order leaves
 *   PENDING, resolving the race between the shopper redirect and the PayFast
 *   ITN delivery
 * - Renders the CelebrationScene (3D particle animation) once paid
 * - Triggers GSAP entrance animation on confirmation text within 500ms
 *
 * Requirements: 10.2, 10.3, 10.6
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CelebrationScene } from '@/components/three/CelebrationScene';
import { useCartStore } from '@/store/cartStore';
import { useGiftWrapStore } from '@/store/giftWrapStore';
import gsap from 'gsap';

interface SuccessClientProps {
  orderId: string;
  merchantTransactionId: string;
  totalAmountZAR: string;
  items: Array<{ name: string; scent: string; quantity: number; price: number }>;
  /** Initial status read from the DB by the Server Component */
  initialStatus: string;
}

/** How long to keep polling before giving up (ms) */
const POLL_TIMEOUT_MS = 120_000;
/** Base interval between polls (ms) */
const POLL_INTERVAL_BASE_MS = 2_000;
/** Cap the interval at this value (ms) */
const POLL_INTERVAL_MAX_MS = 8_000;

export function SuccessClient({
  orderId,
  merchantTransactionId,
  totalAmountZAR,
  items,
  initialStatus,
}: SuccessClientProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [pollError, setPollError] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const clearCart = useCartStore((state) => state.clearCart);
  const resetGiftWrap = useGiftWrapStore((state) => state.reset);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  // ── Cart clear ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'PAID') {
      clearCart();
      resetGiftWrap();
    }
  }, [clearCart, resetGiftWrap, status]);

  // ── GSAP entrance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!confirmationRef.current) return;
    const tween = gsap.fromTo(
      confirmationRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );
    return () => { tween.kill(); };
  }, []);

  // ── Status polling ─────────────────────────────────────────────────────────
  // Use a ref to track the resolved state so the poll callback never captures
  // a stale `status` value from its closure.
  const resolvedRef = useRef(initialStatus !== 'PENDING');

  const poll = useCallback(
    async (attempt: number) => {
      // Don't poll if already resolved or timed out
      if (resolvedRef.current) return;
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        setPollError(true);
        return;
      }

      try {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(merchantTransactionId)}/status`,
          { cache: 'no-store' }
        );

        if (res.ok) {
          const data = (await res.json()) as { status: string };
          if (data.status !== 'PENDING') {
            resolvedRef.current = true;
            setStatus(data.status);
            return; // Resolved — stop polling
          }
        }
      } catch {
        // Network error — keep retrying until timeout
      }

      // Schedule next poll with exponential back-off
      const delay = Math.min(
        POLL_INTERVAL_BASE_MS * 2 ** attempt,
        POLL_INTERVAL_MAX_MS
      );
      pollTimerRef.current = setTimeout(() => poll(attempt + 1), delay);
    },
    [merchantTransactionId]
  );

  useEffect(() => {
    if (status !== 'PENDING') return;
    resolvedRef.current = false;
    pollStartRef.current = Date.now();
    // Kick off first poll after a short initial delay to give the webhook
    // a head-start before we even check.
    pollTimerRef.current = setTimeout(() => poll(0), 1_500);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [status, poll]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const isPaid = status === 'PAID';
  const isFailed = status === 'FAILED';
  const isPending = status === 'PENDING';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      {/* 3D Celebration Animation — only shown once payment is confirmed */}
      {isPaid && (
        <div className="w-full max-w-sm h-48 sm:h-64 mb-6">
          <CelebrationScene particleCount={80} />
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="w-full max-w-sm h-40 mb-6 flex flex-col items-center justify-center gap-4">
          {!pollError && (
            <div className="w-10 h-10 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
          )}
          {pollError ? (
            <div className="text-center space-y-3">
              <p className="text-[var(--theme-accent)]/70 text-sm text-center max-w-xs">
                Payment confirmation is taking longer than expected. Your order has been received — check your email for confirmation.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="/dashboard/orders"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--theme-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  View my orders
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setPollError(false);
                    pollStartRef.current = Date.now();
                    pollTimerRef.current = setTimeout(() => poll(0), 500);
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-[var(--theme-accent)] rounded-lg hover:bg-[var(--theme-accent)]/10 transition-colors text-sm font-medium"
                >
                  Check again
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[var(--theme-accent)]/70 text-sm text-center max-w-xs">
              Confirming your payment&hellip;
            </p>
          )}
        </div>
      )}

      {/* Failed indicator */}
      {isFailed && (
        <div className="w-full max-w-sm h-24 mb-6 flex items-center justify-center">
          <div className="text-5xl" aria-hidden>⚠️</div>
        </div>
      )}

      {/* Order summary card */}
      <div ref={confirmationRef} className="opacity-0 w-full max-w-md">
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--theme-accent)] mb-2">
            {isPaid && 'Order Confirmed! 🎉'}
            {isFailed && 'Payment Unsuccessful'}
            {isPending && 'Order Received'}
          </h1>
          <p className="text-sm sm:text-base text-[var(--theme-accent)]/70">
            {isPaid && 'Thank you for your purchase. A confirmation email is on its way.'}
            {isFailed && 'Your payment could not be processed. Please try again.'}
            {isPending && "We're waiting for payment confirmation."}
          </p>
        </div>

        <div className="bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/10 rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-[var(--theme-accent)]/60">Order ID</span>
            <span className="text-xs font-mono text-[var(--theme-accent)] truncate max-w-[180px]">{orderId}</span>
          </div>

          <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--theme-accent)]/10">
            <span className="text-sm text-[var(--theme-accent)]/60">Total</span>
            <span className="text-xl font-bold text-[var(--theme-accent)]">
              {totalAmountZAR}
            </span>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-accent)]/50 mb-3">Items</h2>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-baseline gap-2 text-sm text-[var(--theme-accent)]/70"
              >
                <span className="truncate">
                  {item.name} ({item.scent})
                </span>
                <span className="shrink-0 text-xs text-[var(--theme-accent)]/50">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          {/* Receipt / Invoice download — only when PAID */}
          {isPaid && (
            <div className="mt-4 pt-4 border-t border-[var(--theme-accent)]/10 grid grid-cols-2 gap-2">
              <a
                href={`/api/documents/receipts/${orderId}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
              >
                <span aria-hidden="true">✅</span> Receipt
              </a>
              <a
                href={`/api/documents/invoices/${orderId}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
              >
                <span aria-hidden="true">🧾</span> Invoice
              </a>
            </div>
          )}

          {/* Retry on failure */}
          {isFailed && (
            <div className="mt-4 pt-4 border-t border-[var(--theme-accent)]/10">
              <a
                href="/cart"
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 rounded-lg transition-colors"
              >
                Return to Cart
              </a>
            </div>
          )}
        </div>

        {/* Continue shopping */}
        {isPaid && (
          <div className="mt-4 text-center">
            <a
              href="/collection"
              className="inline-flex items-center gap-2 text-sm text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] transition-colors"
            >
              Continue shopping
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
