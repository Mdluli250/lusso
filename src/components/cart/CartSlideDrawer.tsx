'use client';

/**
 * CartSlideDrawer — slide-out panel triggered by the cart icon in the navbar.
 * Animates in from the right with GSAP.
 *
 * Fixes applied:
 *   - Header count uses total quantity (sum of item.quantity), not unique line count
 *   - FreeShippingBar shown above item list
 *   - GiftWrapOption shown in footer alongside PromoCodeInput + CartSummary
 *   - GSAP tween race condition fixed: kill in-progress tweens before starting close
 *   - aria-labelledby points to the visible heading id
 *
 * Requirements: 6.1, 6.2
 */

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartUpsell } from './CartUpsell';
import { FreeShippingBar } from './FreeShippingBar';
import { PromoCodeInput } from './PromoCodeInput';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import { EmptyState } from '@/components/ui/EmptyState';

interface CartSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSlideDrawer({ isOpen, onClose }: CartSlideDrawerProps) {
  const items = useCartStore((s) => s.items);
  // Total quantity — not unique line count
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const HEADING_ID = 'cart-slide-drawer-title';

  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Kill any in-progress close animation before starting open
      gsap.killTweensOf(panelRef.current);
      gsap.killTweensOf(overlayRef.current);
      gsap.fromTo(panelRef.current, { x: '100%' }, { x: '0%', duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (panelRef.current) {
      // Kill any in-progress open animation before starting close
      gsap.killTweensOf(panelRef.current);
      gsap.killTweensOf(overlayRef.current);
      gsap.to(panelRef.current, {
        x: '100%',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: onClose,
      });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    } else {
      onClose();
    }
  }, [onClose]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--theme-bg)] shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby={HEADING_ID}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-accent)]/15 shrink-0">
          <h2
            id={HEADING_ID}
            className="text-lg font-semibold text-[var(--theme-accent)]"
          >
            Cart
            {totalItems > 0 && (
              <span className="ml-1.5 text-sm font-normal text-[var(--theme-accent)]/60">
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--theme-accent)]/10 transition-colors text-[var(--theme-accent)]"
            aria-label="Close cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <EmptyState
              title="Your cart is waiting"
              description="Fill it with warmth — browse our hand-poured candle collection."
              action={{ label: 'Continue Shopping', onClick: handleClose }}
            />
          ) : (
            <div className="space-y-2">
              {/* Free shipping progress */}
              <FreeShippingBar />

              {/* Line items */}
              <div>
                {items.map((item) => (
                  <CartItem key={item.variantId} item={item} />
                ))}
              </div>

              {/* Upsell recommendations */}
              <CartUpsell />
            </div>
          )}
        </div>

        {/* Footer — gift wrap + promo + summary + checkout */}
        {items.length > 0 && (
          <div className="border-t border-[var(--theme-accent)]/15 px-6 py-4 space-y-4 shrink-0">
            <GiftWrapOption />
            <PromoCodeInput />
            <CartSummary />
          </div>
        )}
      </div>
    </div>
  );
}
