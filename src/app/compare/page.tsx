'use client';

import { useComparisonStore } from '@/store/comparisonStore';
import { formatZAR } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

/**
 * Compare page — Side-by-side comparison with 3D viewers.
 * Shows prompt when fewer than 2 products are selected.
 */
export default function ComparePage() {
  const slots = useComparisonStore((s) => s.slots);
  const removeProduct = useComparisonStore((s) => s.removeProduct);
  const clear = useComparisonStore((s) => s.clear);
  const filledCount = (slots[0] ? 1 : 0) + (slots[1] ? 1 : 0);

  if (filledCount < 2) {
    return (
      <main className="min-h-screen bg-[var(--theme-bg)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-[var(--theme-accent)]">
            Scent Comparison
          </h1>
          <p className="text-[var(--theme-accent)]/70">
            Select 2 products to compare them side by side. Browse our collection and click
            &quot;Compare&quot; on any product card.
          </p>
          <Link
            href="/collection"
            className="inline-block px-6 py-3 border border-[var(--theme-accent)] rounded-md hover:bg-[var(--theme-accent)]/10 transition-colors text-[var(--theme-accent)]"
          >
            Browse Collection
          </Link>
        </div>
      </main>
    );
  }

  const [productA, productB] = slots;

  return (
    <main className="min-h-screen bg-[var(--theme-bg)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[var(--theme-accent)]">
            Scent Comparison
          </h1>
          <Button variant="secondary" size="sm" onClick={clear}>
            Clear All
          </Button>
        </div>

        {/* Side-by-side grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[productA, productB].map((product) =>
            product ? (
              <div
                key={product.id}
                className="border border-[var(--theme-accent)]/20 rounded-2xl overflow-hidden"
              >
                {/* Product Visual */}
                <div className="aspect-square bg-[var(--theme-accent)]/5 flex items-center justify-center">
                  <svg
                    width="96"
                    height="128"
                    viewBox="0 0 72 96"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <ellipse cx="36" cy="10" rx="5" ry="8" fill="var(--theme-accent)" opacity="0.9" />
                    <line x1="36" y1="18" x2="36" y2="26" stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" />
                    <rect x="18" y="26" width="36" height="58" rx="6" fill="var(--theme-accent)" opacity="0.25" />
                    <rect x="18" y="26" width="36" height="58" rx="6" stroke="var(--theme-accent)" strokeWidth="1.5" opacity="0.6" />
                  </svg>
                </div>

                {/* Product details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold text-[var(--theme-accent)]">
                      {product.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-xs text-[var(--theme-accent)]/50 hover:text-red-400"
                      aria-label={`Remove ${product.name}`}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Comparison attributes */}
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--theme-accent)]/60">Scent Profile</dt>
                      <dd className="font-medium text-[var(--theme-accent)] capitalize">
                        {product.scentProfile}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--theme-accent)]/60">Wax Type</dt>
                      <dd className="font-medium text-[var(--theme-accent)] capitalize">
                        {product.waxType}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--theme-accent)]/60">Burn Time</dt>
                      <dd className="font-medium text-[var(--theme-accent)]">
                        {product.burnTimeHours}h
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--theme-accent)]/60">Price</dt>
                      <dd className="font-medium text-[var(--theme-accent)]">
                        {formatZAR(product.price)}
                      </dd>
                    </div>
                  </dl>

                  {/* Link to product */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="block text-center text-sm text-[var(--theme-accent)] hover:underline mt-3"
                  >
                    View Full Details →
                  </Link>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </main>
  );
}
