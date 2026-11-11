'use client';

/**
 * CollectionClient — Client Component island for the Collection page.
 *
 * Owns all interactive state:
 *   - Filtered product list (driven by FilterPanel)
 *   - Quick View modal open/close + selected product
 *   - Mobile filter drawer (collapsible below lg)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { useState, useCallback } from 'react';
import { FilterPanel } from './FilterPanel';
import { ProductGrid } from './ProductGrid';
import { QuickViewModal } from './QuickViewModal';
import type { ProductWithVariants } from './types';

interface CollectionClientProps {
  allProducts: ProductWithVariants[];
}

export function CollectionClient({ allProducts }: CollectionClientProps) {
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>(allProducts);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithVariants | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleFilteredProducts = useCallback((products: ProductWithVariants[]) => {
    setFilteredProducts(products);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(allProducts);
  }, [allProducts]);

  const handleScentChange = useCallback((_scent: string | null) => {
    // No-op: global theme no longer changes per scent.
  }, []);

  const handleQuickView = useCallback((product: ProductWithVariants) => {
    setQuickViewProduct(product);
  }, []);

  const handleCloseModal = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const activeFilterCount =
    filteredProducts.length < allProducts.length ? 1 : 0;

  return (
    <>
      {/* Mobile filter toggle — only visible below lg */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--theme-accent)]/20 text-sm font-medium text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/5 transition-colors"
          aria-expanded={filtersOpen}
          aria-controls="filter-panel-mobile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--theme-accent)] text-[var(--theme-bg)] text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ml-auto transition-transform ${filtersOpen ? 'rotate-180' : ''}`} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Collapsible filter panel on mobile */}
        {filtersOpen && (
          <div
            id="filter-panel-mobile"
            className="mt-3 rounded-xl border border-[var(--theme-accent)]/15 p-4"
          >
            <FilterPanel
              allProducts={allProducts}
              onFilteredProducts={handleFilteredProducts}
              onReset={handleClearFilters}
              onScentChange={handleScentChange}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Filter sidebar — desktop only */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <FilterPanel
            allProducts={allProducts}
            onFilteredProducts={handleFilteredProducts}
            onReset={handleClearFilters}
            onScentChange={handleScentChange}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm text-[var(--theme-accent)]/60 mb-4"
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
