'use client';

/**
 * ProductDetailClient — Client Component island for the Product Detail page.
 *
 * Handles all interactive state:
 *   - Variant selection (swaps 3D model + triggers color theme change)
 *   - Add to Cart with toast confirmation
 *   - Scroll-driven ingredient reveal animations
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { useState, useCallback, useEffect } from 'react';
import { CandleViewer } from '@/components/three/CandleViewer';
import { useColorTheme } from '@/components/animation/useColorTheme';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { SubscriptionSelector } from '@/components/subscription/SubscriptionSelector';
import { formatZAR } from '@/lib/formatCurrency';
import { useCartStore } from '@/store/cartStore';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { VariantSelector } from './VariantSelector';
import { IngredientSection, type Ingredient } from './IngredientSection';
import type { ProductWithVariants, ProductVariant } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface ProductDetailClientProps {
  product: ProductWithVariants;
}

// ─── Ingredient data derived from product ─────────────────────────

function getIngredients(product: ProductWithVariants): Ingredient[] {
  return [
    {
      title: 'Wax Type',
      description: `Made with premium ${product.waxType} wax for a clean, even burn with minimal soot.`,
      icon: '🕯️',
    },
    {
      title: 'Scent Profile',
      description: `Infused with natural ${product.scentProfile} fragrance oils for an authentic, long-lasting aroma.`,
      icon: '🌸',
    },
    {
      title: 'Burn Time',
      description: `Enjoy up to ${product.burnTimeHours} hours of continuous burn time per candle.`,
      icon: '⏱️',
    },
    {
      title: 'Handcrafted',
      description: 'Each candle is hand-poured in small batches to ensure quality and consistency.',
      icon: '✋',
    },
  ];
}

// ─── ProductDetailClient ──────────────────────────────────────────

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0]
  );
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const recordView = useRecentlyViewedStore((s) => s.record);

  // Animate color theme when variant changes
  useColorTheme(selectedVariant?.scent ?? null);

  // Record product view on mount
  useEffect(() => {
    recordView(product.id);
  }, [product.id, recordView]);

  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      scent: selectedVariant.scent,
      price: product.price,
      modelPath: selectedVariant.modelPath,
      imageUrl: '',
    });

    showToast(`${product.name} added to cart`);
  }, [product, selectedVariant, isOutOfStock, addItem, showToast]);

  const ingredients = getIngredients(product);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-12 lg:py-20">
        {/* Main product section */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: 3D Viewer */}
          <div className="aspect-square lg:sticky lg:top-24 lg:self-start rounded-2xl overflow-hidden bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/15">
            {selectedVariant ? (
              <CandleViewer
                modelPath={selectedVariant.modelPath}
                autoRotate={true}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--theme-accent)]/40 text-sm">
                No 3D model available
              </div>
            )}
          </div>

          {/* Right: Product info */}
          <div className="flex flex-col gap-6">
            {/* Name + Wishlist */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--theme-accent)] leading-tight">
                {product.name}
              </h1>
              <WishlistButton productId={product.id} className="shrink-0 mt-2" />
            </div>

            {/* Description */}
            <p className="text-base text-[var(--theme-accent)]/70 leading-relaxed max-w-prose">
              {product.description}
            </p>

            {/* Attribute badges */}
            <div className="flex flex-wrap gap-2" aria-label="Product attributes">
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
                {product.scentProfile}
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
                {product.waxType}
              </span>
              <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80">
                {product.burnTimeHours}h burn time
              </span>
            </div>

            {/* Price */}
            <div className="pt-4 border-t border-[var(--theme-accent)]/15">
              <span
                className="text-3xl sm:text-4xl font-bold text-[var(--theme-accent)]"
                aria-label={`Price: ${formatZAR(product.price)}`}
              >
                {formatZAR(product.price)}
              </span>
            </div>

            {/* Variant selector */}
            {product.variants.length > 1 && (
              <VariantSelector
                variants={product.variants}
                selectedVariantId={selectedVariant?.id ?? ''}
                onSelect={handleVariantSelect}
              />
            )}

            {/* Add to Cart */}
            <div className="flex flex-col gap-3 pt-4">
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

              {isOutOfStock && (
                <p className="text-sm text-red-400/80 text-center">
                  This variant is currently out of stock.
                </p>
              )}
            </div>

            {/* Subscription option */}
            {selectedVariant && !isOutOfStock && (
              <SubscriptionSelector
                variantId={selectedVariant.id}
                price={product.price}
              />
            )}
          </div>
        </div>

        {/* Scroll-driven ingredient section */}
        <div className="mt-16 lg:mt-24 max-w-3xl">
          <IngredientSection ingredients={ingredients} />
        </div>

        {/* Reviews section */}
        <div className="mt-16 lg:mt-24 max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--theme-accent)] mb-6">
            Customer Reviews
          </h2>
          <ReviewList productId={product.id} />

          <div className="mt-8 pt-8 border-t border-[var(--theme-accent)]/15">
            <h3 className="text-lg font-semibold text-[var(--theme-accent)] mb-4">
              Write a Review
            </h3>
            <ReviewForm productId={product.id} />
          </div>
        </div>

        {/* Recently Viewed section */}
        <div className="mt-16 lg:mt-24 max-w-3xl">
          <RecentlyViewed />
        </div>
      </div>
    </div>
  );
}
