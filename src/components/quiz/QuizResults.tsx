'use client';

/**
 * QuizResults — displays recommended products from the scent quiz.
 *
 * Shows product cards with links, or a fallback message with link to /collection.
 *
 * Requirements: 6.3, 6.4
 */

import Link from 'next/link';
import { formatZAR } from '@/lib/formatCurrency';

interface QuizProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  modelPath: string;
}

interface QuizResultsProps {
  products: QuizProduct[];
  message?: string;
}

export function QuizResults({ products, message }: QuizResultsProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--theme-accent)]/70 mb-4">
          {message ?? "We couldn't find a perfect match for your preferences."}
        </p>
        <Link
          href="/collection"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-gray-900 font-medium shadow-sm hover:opacity-90 transition-opacity"
        >
          Browse Full Collection
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-[var(--theme-accent)] text-center mb-6">
        {message ?? 'Your Perfect Scents'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group flex flex-col p-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-accent)]/8 transition-all duration-200"
          >
            <h4 className="font-semibold text-[var(--theme-accent)] group-hover:opacity-80 transition-opacity line-clamp-2">
              {product.name}
            </h4>
            <span className="text-xs font-medium px-2 py-0.5 mt-2 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize w-fit">
              {product.scentProfile}
            </span>
            <span className="text-lg font-bold text-[var(--theme-accent)] mt-auto pt-3">
              {formatZAR(product.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
