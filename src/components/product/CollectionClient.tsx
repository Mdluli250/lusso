'use client';

/**
 * CollectionClient — Client Component island for the Collection page.
 *
 * Owns all interactive state:
 *   - Filtered product list (driven by FilterPanel)
 *   - Quick View modal open/close + selected product
 *
 * The full product list is passed in as a prop from the Server Component,
 * so no additional data fetching happens on the client.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { useState, useCallback } from 'react';
import { FilterPanel } from './FilterPanel';
import { ProductGrid } from './ProductGrid';
import { QuickViewModal } from './QuickViewModal';
import { getColorTheme } from '@/lib/scentColorMap';
import { animationEngine } from '@/components/animation/AnimationEngine';
import type { ProductWithVariants } from './types';

interface CollectionClientProps {
  allProducts: ProductWithVariants[];
}

export function CollectionClient({ allProducts }: CollectionClientProps) {
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>(allProducts);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithVariants | null>(null);

  const handleFilteredProducts = useCallback((products: ProductWithVariants[]) => {
    setFilteredProducts(products);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(allProducts);
  }, [allProducts]);

  const handleScentChange = useCallback((scent: string | null) => {
    if (scent) {
      const theme = getColorTheme(scent);
      animationEngine.animateColorTheme(theme.bg, theme.accent);
    } else {
      // Animate back to default theme
      animationEngine.animateColorTheme('#1A1A1A', '#FFFFFF');
    }
  }, []);

  const handleQuickView = useCallback((product: ProductWithVariants) => {
    setQuickViewProduct(product);
  }, []);

  const handleCloseModal = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <aside className="lg:w-72 shrink-0">
          <FilterPanel
            allProducts={allProducts}
            onFilteredProducts={handleFilteredProducts}
            onReset={handleClearFilters}
            onScentChange={handleScentChange}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Results count */}
          <p
            className="text-sm text-[var(--theme-accent)]/60 mb-5"
            aria-live="polite"
            aria-atomic="true"
          >
            {filteredProducts.length === allProducts.length
              ? `${allProducts.length} product${allProducts.length === 1 ? '' : 's'}`
              : `${filteredProducts.length} of ${allProducts.length} product${allProducts.length === 1 ? '' : 's'}`}
          </p>

          <ProductGrid
            products={filteredProducts}
            onClearFilters={handleClearFilters}
            onQuickView={handleQuickView}
          />
        </div>
      </div>

      {/* Quick View modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={quickViewProduct !== null}
        onClose={handleCloseModal}
      />
    </>
  );
}
