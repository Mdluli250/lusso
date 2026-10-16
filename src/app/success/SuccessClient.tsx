'use client';

/**
 * SuccessClient — Client Component island for the Success page.
 *
 * Responsibilities:
 * - Clears the Zustand cart on mount
 * - Polls /api/orders/[merchantTransactionId]/status until the order leaves
 *   PENDING, resolving the race between the shopper redirect and the Peach
 *   webhook delivery
 * - Renders the CelebrationScene (3D particle animation) once paid
 * - Triggers GSAP entrance animation on confirmation text within 500ms
 *
 * Requirements: 10.2, 10.3, 10.6
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CelebrationScene } from '@/components/three/CelebrationScene';
import { useCartStore } from '@/store/cartStore';
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
const POLL_TIMEOUT_MS = 60_000;
/** Base interval between polls (ms); doubles on each attempt */
const POLL_INTERVAL_BASE_MS = 2_000;
/** Cap the interval at this value (ms) */
const POLL_INTERVAL_MAX_MS = 10_000;

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
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  // ── Cart clear ─────────────────────────────────────────────────────────────
  useEffect(() => {
    clearCart();
  }, [clearCart]);

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
  const poll = useCallback(
    async (attempt: number) => {
      // Don't poll if already resolved or timed out
      if (status !== 'PENDING') return;
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
    [merchantTransactionId, status]
  );

  useEffect(() => {
    if (status !== 'PENDING') return;
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* 3D Celebration Animation — only shown once payment is confirmed */}
      {isPaid && (
        <div className="w-full max-w-lg h-64 mb-8">
          <CelebrationScene particleCount={80} />
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="w-full max-w-lg h-64 mb-8 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--theme-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--theme-accent)]/70 text-sm">
            {pollError
              ? 'Payment confirmation is taking longer than expected. Check your email or visit your dashboard.'
              : 'Confirming your payment…'}
          </p>
        </div>
      )}

      {/* Failed indicator */}
      {isFailed && (
        <div className="w-full max-w-lg h-32 mb-8 flex items-center justify-center">
          <div className="text-4xl" aria-hidden>⚠️</div>
        </div>
      )}

      {/* Order summary card */}
      <div ref={confirmationRef} className="opacity-0 text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-[var(--theme-accent)] mb-2">
          {isPaid && 'Order Confirmed!'}
          {isFailed && 'Payment Unsuccessful'}
          {isPending && 'Order Received'}
        </h1>

        <p className="text-lg text-[var(--theme-accent)]/70 mb-6">
          {isPaid && 'Thank you for your purchase.'}
          {isFailed && 'Your payment could not be processed. Please try again.'}
          {isPending && 'We\'re waiting for payment confirmation.'}
        </p>

        <div className="bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/10 rounded-lg p-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--theme-accent)]/60">Order ID</span>
            <span className="text-sm font-mono text-[var(--theme-accent)]">{orderId}</span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--theme-accent)]/60">Total</span>
            <span className="text-lg font-semibold text-[var(--theme-accent)]">
              {totalAmountZAR}
            </span>
          </div>

          <hr className="border-[var(--theme-accent)]/10 mb-4" />

          <h2 className="text-sm font-semibold text-[var(--theme-accent)]/80 mb-3">Items</h2>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center text-sm text-[var(--theme-accent)]/70"
              >
                <span>
                  {item.name} ({item.scent}) × {item.quantity}
                </span>
              </li>
            ))}
          </ul>

          {/* Receipt download — only when PAID */}
          {isPaid && (
            <div className="mt-4 pt-4 border-t border-[var(--theme-accent)]/10">
              <a
                href={`/api/documents/receipts/${orderId}`}
                download
                className="inline-block px-4 py-2 text-sm font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
              >
                Download Receipt
              </a>
            </div>
          )}

          {/* Retry link on failure */}
          {isFailed && (
            <div className="mt-4 pt-4 border-t border-[var(--theme-accent)]/10">
              <a
                href="/cart"
                className="inline-block px-4 py-2 text-sm font-medium text-[var(--theme-accent)] bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2"
              >
                Return to Cart
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
