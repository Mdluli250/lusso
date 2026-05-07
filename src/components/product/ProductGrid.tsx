'use client';

/**
 * ProductGrid — renders a responsive grid of ProductCard components.
 *
 * - Accepts a `products` prop (already filtered by FilterPanel)
 * - Shows SkeletonCard placeholders while `isLoading` is true
 * - Displays "No products found" + clear-filters button when the list is empty
 *
 * Requirements: 4.1, 4.7, 11.5
 */

import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Button } from '@/components/ui/Button';
import { ProductCard } from './ProductCard';
import type { ProductWithVariants } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface ProductGridProps {
  products: ProductWithVariants[];
  isLoading?: boolean;
  /** Called when the user clicks "Clear filters" in the empty state */
  onClearFilters?: () => void;
  /** Called when the user clicks "Quick View" on a card */
  onQuickView: (product: ProductWithVariants) => void;
}

// ─── Skeleton grid ────────────────────────────────────────────────

const SKELETON_COUNT = 6;

function SkeletonGrid() {
  return (
    <ul
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-label="Loading products"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <li key={i}>
          <SkeletonCard />
        </li>
      ))}
    </ul>
  );
}

// ─── Empty state ──────────────────────────────────────────────────

function EmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-6 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full bg-[var(--theme-accent)]/10 flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="16"
            cy="16"
            r="13"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--theme-accent)]/40"
          />
          <path
            d="M11 11l10 10M21 11L11 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-[var(--theme-accent)]/40"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <p className="text-lg font-semibold text-[var(--theme-accent)]">
          No products found
        </p>
        <p className="text-sm text-[var(--theme-accent)]/60 max-w-xs">
          Try adjusting your filters or search query to find what you&apos;re looking for.
        </p>
      </div>

      {onClearFilters && (
        <Button
          variant="secondary"
          size="md"
          onClick={onClearFilters}
          aria-label="Clear all filters and show all products"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}

// ─── ProductGrid ──────────────────────────────────────────────────

export function ProductGrid({
  products,
  isLoading = false,
  onClearFilters,
  onQuickView,
}: ProductGridProps) {
  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (products.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <ul
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label={`${products.length} product${products.length === 1 ? '' : 's'} found`}
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} onQuickView={onQuickView} />
        </li>
      ))}
    </ul>
  );
}
