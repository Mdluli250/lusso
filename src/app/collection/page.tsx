/**
 * Collection page — Server Component.
 *
 * Fetches all active products with their variants from the database and
 * passes them to the CollectionClient island for client-side filtering.
 *
 * This pattern avoids round-trips on every filter change: all products are
 * fetched once at request time and filtering happens entirely in the browser.
 *
 * Requirements: 4.1
 */

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CollectionClient } from '@/components/product/CollectionClient';

// ─── Metadata ─────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Collection',
  description:
    'Browse our full range of hand-poured Lusso candles. Filter by scent, wax type, and burn time to find your perfect match.',
};

// ─── Data fetching ────────────────────────────────────────────────

async function getAllProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Gracefully handle DB errors during build or when DB is unavailable
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function CollectionPage() {
  const products = await getAllProducts();

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16">
        {/* Page header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--theme-accent)] leading-tight">
            Our Collection
          </h1>
          <p className="mt-3 text-lg text-[var(--theme-accent)]/70 max-w-xl">
            Handcrafted candles made with natural ingredients. Each one a unique
            sensory experience.
          </p>
        </header>

        {/* Client island: filter panel + product grid + quick view modal */}
        <CollectionClient allProducts={products} />
      </div>
    </div>
  );
}
