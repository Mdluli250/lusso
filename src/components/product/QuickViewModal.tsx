'use client';

/**
 * QuickViewModal — modal overlay for quick product preview.
 *
 * Displays:
 *   - CandleViewer with the product's default variant 3D model
 *   - Product name, price (formatZAR), scent profile, wax type, burn time
 *   - "Add to Cart" button that dispatches to the Zustand cart store
 *   - "View Full Details" link to the product detail page
 *
 * Requirements: 4.6
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CandleViewer } from '@/components/three/CandleViewer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatZAR } from '@/lib/formatCurrency';
import { useCartStore } from '@/store/cartStore';
import type { ProductWithVariants } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface QuickViewModalProps {
  product: ProductWithVariants | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── QuickViewModal ───────────────────────────────────────────────

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap inside modal
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    first?.focus();
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const defaultVariant = product.variants[0];
  const isOutOfStock = !defaultVariant || defaultVariant.stock === 0;

  const handleAddToCart = () => {
    if (!defaultVariant || isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: defaultVariant.id,
      name: product.name,
      scent: defaultVariant.scent,
      price: product.price,
      modelPath: defaultVariant.modelPath,
      imageUrl: '',
    });

    showToast(`${product.name} added to cart`);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Modal panel */}
      <div
        className={[
          'relative w-full max-w-4xl max-h-[90vh] overflow-y-auto',
          'bg-[var(--theme-bg)] rounded-2xl shadow-2xl',
          'border border-[var(--theme-accent)]/30',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={[
            'absolute top-4 right-4 z-10',
            'w-10 h-10 rounded-full',
            'bg-[var(--theme-accent)]/10 hover:bg-[var(--theme-accent)]/20',
            'text-[var(--theme-accent)]',
            'flex items-center justify-center',
            'transition-colors duration-150',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
          ].join(' ')}
          aria-label="Close quick view"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Left: 3D viewer */}
          <div className="aspect-square rounded-xl overflow-hidden bg-[var(--theme-accent)]/5">
            <CandleViewer
              modelPath={defaultVariant?.modelPath || '/models/candle-compressed.glb'}
              autoRotate={true}
              className="w-full h-full"
            />
          </div>

          {/* Right: Product info */}
          <div className="flex flex-col gap-5">
            {/* Name + description */}
            <div>
              <h2
                id="quick-view-title"
                className="text-2xl md:text-3xl font-bold text-[var(--theme-accent)] leading-tight"
              >
                {product.name}
              </h2>
              <p className="mt-3 text-[var(--theme-accent)]/70 leading-relaxed text-sm">
                {product.description}
              </p>
            </div>

            {/* Attribute badges */}
            <div className="flex flex-wrap gap-2" aria-label="Product attributes">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
                {product.scentProfile}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
                {product.waxType}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80">
                {product.burnTimeHours}h burn time
              </span>
            </div>

            {/* Price */}
            <div className="pt-3 border-t border-[var(--theme-accent)]/15">
              <span
                className="text-3xl font-bold text-[var(--theme-accent)]"
                aria-label={`Price: ${formatZAR(product.price)}`}
              >
                {formatZAR(product.price)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                aria-label={
                  isOutOfStock
                    ? 'Out of stock — cannot add to cart'
                    : `Add ${product.name} to cart`
                }
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              <Link
                href={`/products/${product.slug}`}
                className={[
                  'inline-flex items-center justify-center gap-2',
                  'px-5 py-2.5 rounded-lg text-base font-medium leading-none',
                  'bg-transparent text-[var(--theme-accent)]',
                  'border border-[var(--theme-accent)]',
                  'hover:bg-[var(--theme-accent)]/10 active:bg-[var(--theme-accent)]/20',
                  'transition-all duration-150',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
                ].join(' ')}
                onClick={onClose}
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
