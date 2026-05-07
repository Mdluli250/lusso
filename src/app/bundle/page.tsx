import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { BundleBuilder } from '@/components/bundle/BundleBuilder';
import { BundleProductPicker } from './BundleProductPicker';

/**
 * Bundle page — hosts BundleBuilder with a product picker.
 *
 * Requirements: 7.1, 7.5
 */

export const metadata: Metadata = {
  title: 'Build a Bundle',
  description:
    'Pick any 3 Lusso candles and save 15%. Build your perfect bundle of hand-poured luxury candles.',
};

export default async function BundlePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: {
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });

  const productData = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    scentProfile: p.scentProfile,
    modelPath: p.variants[0]?.modelPath ?? '/models/candle-compressed.glb',
    variantId: p.variants[0]?.id ?? '',
  }));

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--theme-accent)] mb-3">
            Build Your Bundle
          </h1>
          <p className="text-[var(--theme-accent)]/60">
            Pick any 3 candles and save 15% on your bundle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product picker */}
          <div className="lg:col-span-2">
            <BundleProductPicker products={productData} />
          </div>

          {/* Bundle builder sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <BundleBuilder />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
