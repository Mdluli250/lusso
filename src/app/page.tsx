/**
 * Home page — Server Component.
 *
 * Fetches up to 6 active featured products from the database and renders:
 *   1. HeroSection — Client Component island with scroll-driven 3D candle + parallax
 *   2. Featured products section — responsive grid with scroll-triggered entrance
 *
 * Requirements: 3.1, 4.1
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedParallax } from '@/components/home/FeaturedParallax';
import { FeaturedProductCard } from '@/components/home/FeaturedProductCard';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';

// ─── Data fetching ────────────────────────────────────────────────

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  } catch {
    // Gracefully handle DB errors (e.g. during build / no DB connection)
    return [];
  }
}

// ─── Home Page ────────────────────────────────────────────────────

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen bg-[var(--theme-bg)] transition-colors duration-700">
      {/* 3D Hero Section — Client Component island */}
      <HeroSection />

      {/* Featured Products Section */}
      <FeaturedParallax>
      <section
        className="py-24 px-6 sm:px-8 lg:px-16 bg-[var(--theme-bg)] transition-colors duration-700"
        aria-labelledby="featured-heading"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div data-parallax="heading" className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <h2
                id="featured-heading"
                className="text-3xl sm:text-4xl font-bold text-[var(--theme-accent)] leading-tight"
              >
                Our Collection
              </h2>
              <p className="mt-2 text-[var(--theme-accent)]/70 text-lg">
                Hand-poured candles designed to elevate everyday living through scent, warmth, and quiet luxury.
              </p>
            </div>
            <Link
              href="/collection"
              className={[
                'inline-flex items-center gap-2 shrink-0',
                'text-[var(--theme-accent)] font-medium text-base',
                'border border-[var(--theme-accent)] rounded-lg px-5 py-2.5',
                'hover:bg-[var(--theme-accent)]/10 active:bg-[var(--theme-accent)]/20',
                'transition-colors duration-150',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
              ].join(' ')}
            >
              View all
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Product grid */}
          {featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <p className="text-[var(--theme-accent)]/60 text-lg">
                No products available yet. Check back soon!
              </p>
              <Link
                href="/collection"
                className="text-[var(--theme-accent)] underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Browse the collection
              </Link>
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              role="list"
              aria-label="Featured candle products"
            >
              {featuredProducts.map((product) => {
                const defaultVariant = product.variants[0];
                return (
                  <li key={product.id} data-parallax="card">
                    <FeaturedProductCard
                      name={product.name}
                      slug={product.slug}
                      description={product.description}
                      price={product.price}
                      scentProfile={product.scentProfile}
                      waxType={product.waxType}
                      burnTimeHours={product.burnTimeHours}
                      modelPath={defaultVariant?.modelPath || '/models/candle-compressed.glb'}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      </FeaturedParallax>

      {/* Recently Viewed Section */}
      <section className="py-12 px-6 sm:px-8 lg:px-16 bg-[var(--theme-bg)] transition-colors duration-700">
        <div className="max-w-7xl mx-auto">
          <RecentlyViewed />
        </div>
      </section>
    </div>
  );
}
