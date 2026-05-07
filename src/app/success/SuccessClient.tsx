'use client';

/**
 * SuccessClient — Client Component island for the Success page.
 *
 * Responsibilities:
 * - Renders the CelebrationScene (3D particle animation)
 * - Triggers GSAP entrance animation on confirmation text within 500ms
 * - Clears the Zustand cart on mount
 *
 * Requirements: 10.2, 10.3, 10.6
 */

import { useEffect, useRef } from 'react';
import { CelebrationScene } from '@/components/three/CelebrationScene';
import { useCartStore } from '@/store/cartStore';
import gsap from 'gsap';

interface SuccessClientProps {
  orderId: string;
  totalAmountZAR: string;
  items: Array<{ name: string; scent: string; quantity: number; price: number }>;
  status?: string;
}

export function SuccessClient({ orderId, totalAmountZAR, items, status }: SuccessClientProps) {
  const confirmationRef = useRef<HTMLDivElement>(null);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear the cart from localStorage on mount (Requirement 10.6)
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    // Trigger GSAP entrance animation within 500ms of load (Requirement 10.3)
    if (!confirmationRef.current) return;

    const tween = gsap.fromTo(
      confirmationRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0,
      }
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* 3D Celebration Animation (Requirement 10.2) */}
      <div className="w-full max-w-lg h-64 mb-8">
        <CelebrationScene particleCount={80} />
      </div>

      {/* Order Confirmation Text with GSAP entrance animation (Requirement 10.3, 10.4) */}
      <div ref={confirmationRef} className="opacity-0 text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-[var(--theme-accent)] mb-2">
          Order Confirmed!
        </h1>
        <p className="text-lg text-[var(--theme-accent)]/70 mb-6">
          Thank you for your purchase.
        </p>

        {/* Order Summary */}
        <div className="bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/10 rounded-lg p-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--theme-accent)]/60">Order ID</span>
            <span className="text-sm font-mono text-[var(--theme-accent)]">
              {orderId}
            </span>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[var(--theme-accent)]/60">Total</span>
            <span className="text-lg font-semibold text-[var(--theme-accent)]">
              {totalAmountZAR}
            </span>
          </div>

          <hr className="border-[var(--theme-accent)]/10 mb-4" />

          <h2 className="text-sm font-semibold text-[var(--theme-accent)]/80 mb-3">
            Items
          </h2>
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

          {status === 'PAID' && (
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
        </div>
      </div>
    </div>
  );
}
