/**
 * Product Detail page — Server Component.
 *
 * Fetches a Product and all its ProductVariant records by slug from the database,
 * then renders the ProductDetailClient island for interactive 3D viewing,
 * variant selection, and add-to-cart functionality.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { RecommendationsSection } from '@/components/product/RecommendationsSection';
import { ProductJsonLd } from '@/components/seo/ProductJsonLd';

// ─── Types ────────────────────────────────────────────────────────

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// ─── Data fetching ────────────────────────────────────────────────

async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });
  } catch {
    return null;
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const priceFormatted = `R${(product.price / 100).toFixed(2)}`;
  const description = `${product.description.slice(0, 140)} — ${priceFormatted}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Lusso`,
      description,
      type: 'website',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd
        name={product.name}
        description={product.description}
        price={product.price}
        slug={product.slug}
        scentProfile={product.scentProfile}
      />
      <ProductDetailClient product={product} />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 pb-16">
        <Suspense fallback={null}>
          <RecommendationsSection productId={product.id} />
        </Suspense>
      </div>
    </>
  );
}
