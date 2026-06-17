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
import Image from 'next/image';
import { useColorTheme } from '@/components/animation/useColorTheme';
import { useToast } from '@/components/ui/Toast';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { SubscriptionSelector } from '@/components/subscription/SubscriptionSelector';
import { formatZAR } from '@/lib/formatCurrency';
import { getProductImages } from '@/lib/getProductImages';
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
  const [imgError, setImgError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const { showToast } = useToast();
  const recordView = useRecentlyViewedStore((s) => s.record);

  // Get gallery images for this product
  const productImages = getProductImages(product.id);

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

    showToast(`${product.name} added to cart`, {
      action: { label: 'Undo', onClick: () => removeItem(selectedVariant.id) },
    });
  }, [product, selectedVariant, isOutOfStock, addItem, removeItem, showToast]);

  const ingredients = getIngredients(product);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-12 lg:py-20">
        {/* Breadcrumb navigation */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/collection' }, { label: product.name }]} />

        {/* Main product section */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Product Visual */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)]/15">
              {imgError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    width="120"
                    height="160"
                    viewBox="0 0 72 96"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <ellipse cx="36" cy="10" rx="5" ry="8" fill={selectedVariant?.colorHex ?? 'var(--theme-accent)'} opacity="0.9" />
                    <line x1="36" y1="18" x2="36" y2="26" stroke={selectedVariant?.colorHex ?? 'var(--theme-accent)'} strokeWidth="2" strokeLinecap="round" />
                    <rect x="18" y="26" width="36" height="58" rx="6" fill={selectedVariant?.colorHex ?? 'var(--theme-accent)'} opacity="0.25" />
                    <rect x="18" y="26" width="36" height="58" rx="6" stroke={selectedVariant?.colorHex ?? 'var(--theme-accent)'} strokeWidth="1.5" opacity="0.6" />
                    <line x1="24" y1="52" x2="48" y2="52" stroke={selectedVariant?.colorHex ?? 'var(--theme-accent)'} strokeWidth="1" opacity="0.5" />
                    <line x1="24" y1="58" x2="44" y2="58" stroke={selectedVariant?.colorHex ?? 'var(--theme-accent)'} strokeWidth="1" opacity="0.4" />
                  </svg>
                </div>
              ) : (
                <Image
                  src={productImages[activeImageIndex]}
                  alt={`${product.name} view ${activeImageIndex + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 mt-3">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImageIndex ? 'border-[var(--theme-accent)]' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
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

      {/* Sticky mobile add-to-cart bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[var(--theme-bg)] border-t border-[var(--theme-accent)]/15 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <p className="text-sm font-semibold text-[var(--theme-accent)]">{product.name}</p>
          <p className="text-lg font-bold text-[var(--theme-accent)]">{formatZAR(product.price)}</p>
        </div>
        <Button variant="primary" size="md" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock === 0}>
          Add to Cart
        </Button>
      </div>
      {/* Bottom padding to prevent content from being hidden behind sticky bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
