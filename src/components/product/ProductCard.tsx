'use client';

/**
 * ProductCard — displays a single product in the collection grid.
 *
 * Shows:
 *   - 3D thumbnail via CandleViewer (with static fallback)
 *   - Product name, scent profile badge, wax type badge, burn time
 *   - Price formatted via formatZAR
 *   - "Quick View" button that opens the QuickViewModal
 *   - Link to the full product detail page
 *
 * Requirements: 4.1, 6.5
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LazyCandleViewer } from '@/components/three/LazyCandleViewer';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { CompareButton } from '@/components/comparison/CompareButton';
import { formatZAR } from '@/lib/formatCurrency';
import type { ProductWithVariants } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductWithVariants;
  onQuickView: (product: ProductWithVariants) => void;
}

// ─── Candle icon placeholder ──────────────────────────────────────
// Shown when no 3D model is available yet (placeholder .glb paths).

function CandlePlaceholder({ colorHex }: { colorHex?: string }) {
  const color = colorHex ?? 'var(--theme-accent)';
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        width="72"
        height="96"
        viewBox="0 0 72 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Flame */}
        <ellipse cx="36" cy="10" rx="5" ry="8" fill={color} opacity="0.9" />
        {/* Wick */}
        <line x1="36" y1="18" x2="36" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Candle body */}
        <rect x="18" y="26" width="36" height="58" rx="6" fill={color} opacity="0.25" />
        <rect x="18" y="26" width="36" height="58" rx="6" stroke={color} strokeWidth="1.5" opacity="0.6" />
        {/* Label line */}
        <line x1="24" y1="52" x2="48" y2="52" stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1="24" y1="58" x2="44" y2="58" stroke={color} strokeWidth="1" opacity="0.4" />
      </svg>
    </div>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const defaultVariant = product.variants[0];

  return (
    <article
      className={[
        'group flex flex-col rounded-2xl overflow-hidden',
        'border border-[var(--theme-accent)]/20',
        'bg-[var(--theme-accent)]/5',
        'hover:border-[var(--theme-accent)]/40',
        'hover:bg-[var(--theme-accent)]/8',
        'transition-all duration-200',
      ].join(' ')}
      aria-label={product.name}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-square overflow-hidden bg-[var(--theme-accent)]/10">
        <Link
          href={`/products/${product.slug}`}
          className="block w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]"
          tabIndex={0}
          aria-label={`View details for ${product.name}`}
        >
          <LazyCandleViewer
            modelPath={defaultVariant?.modelPath || '/models/candle-compressed.glb'}
            autoRotate={true}
            className="w-full h-full"
          />
        </Link>

        {/* Wishlist button — top-right of thumbnail */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton productId={product.id} />
        </div>

        {/* Compare button — top-left of thumbnail */}
        <div className="absolute top-2 left-2 z-10">
          <CompareButton
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              scentProfile: product.scentProfile,
              waxType: product.waxType,
              burnTimeHours: product.burnTimeHours,
              modelPath: defaultVariant?.modelPath || '/models/candle-compressed.glb',
              addedAt: 0,
            }}
          />
        </div>

        {/* Quick View overlay button — appears on hover */}
        <div
          className={[
            'absolute inset-x-0 bottom-0 p-3',
            'translate-y-full group-hover:translate-y-0',
            'transition-transform duration-200 ease-out',
          ].join(' ')}
        >
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onQuickView(product)}
            aria-label={`Quick view ${product.name}`}
            className="backdrop-blur-sm"
          >
            Quick View
          </Button>
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className={[
            'font-semibold text-base leading-snug',
            'text-[var(--theme-accent)]',
            'hover:opacity-80 transition-opacity',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
            'line-clamp-2',
          ].join(' ')}
        >
          {product.name}
        </Link>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5" aria-label="Product attributes">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
            {product.scentProfile}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
            {product.waxType}
          </span>
          <span className="text-xs text-[var(--theme-accent)]/60">
            {product.burnTimeHours}h burn
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span
            className="text-lg font-bold text-[var(--theme-accent)]"
            aria-label={`Price: ${formatZAR(product.price)}`}
          >
            {formatZAR(product.price)}
          </span>

          {/* Stock indicator */}
          {defaultVariant && defaultVariant.stock === 0 ? (
            <span className="text-xs text-red-500 font-medium">
              Out of stock
            </span>
          ) : defaultVariant && defaultVariant.stock <= 5 ? (
            <span className="text-xs text-amber-500 font-medium animate-pulse">
              Only {defaultVariant.stock} left!
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
