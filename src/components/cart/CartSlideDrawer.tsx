'use client';

/**
 * CartSlideDrawer — a slide-out panel triggered by the cart icon.
 * Animates in from the right with GSAP, shows cart items and checkout link.
 *
 * Requirements: 6.1, 6.2
 */

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { CartUpsell } from './CartUpsell';
import { EmptyState } from '@/components/ui/EmptyState';

interface CartSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSlideDrawer({ isOpen, onClose }: CartSlideDrawerProps) {
  const items = useCartStore((s) => s.items);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.fromTo(panelRef.current, { x: '100%' }, { x: '0%', duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (panelRef.current) {
      gsap.to(panelRef.current, { x: '100%', duration: 0.25, ease: 'power2.in', onComplete: onClose });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    } else {
      onClose();
    }
  }, [onClose]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div ref={overlayRef} className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden="true" />

      {/* Panel */}
      <div ref={panelRef} className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--theme-bg)] shadow-xl flex flex-col" role="dialog" aria-modal="true" aria-label="Shopping cart">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-accent)]/15">
          <h2 className="text-lg font-semibold text-[var(--theme-accent)]">Cart ({items.length})</h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--theme-accent)]/10 transition-colors text-[var(--theme-accent)]" aria-label="Close cart">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <EmptyState
              title="Your cart is waiting"
              description="Fill it with warmth — browse our hand-poured candle collection."
              action={{ label: 'Continue Shopping', onClick: handleClose }}
            />
          ) : (
            <div className="space-y-4">
              {items.map((item) => <CartItem key={item.variantId} item={item} />)}
              <CartUpsell />
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--theme-accent)]/15 px-6 py-4 space-y-3">
            <CartSummary />
            <Link href="/checkout" onClick={handleClose} className="block w-full text-center px-6 py-3 bg-[var(--theme-accent)] text-cream rounded-lg font-medium hover:opacity-90 transition-opacity">
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
