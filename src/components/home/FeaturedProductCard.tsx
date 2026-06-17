'use client';

/**
 * FeaturedProductCard — Client Component for the home page featured grid.
 *
 * Renders a 3D CandleViewer thumbnail with product info and a link
 * to the product detail page.
 */

import Link from 'next/link';
import { formatZAR } from '@/lib/formatCurrency';

interface FeaturedProductCardProps {
  name: string;
  slug: string;
  description: string;
  price: number;
  scentProfile: string;
  waxType: string;
  burnTimeHours: number;
  modelPath: string;
}

export function FeaturedProductCard({
  name,
  slug,
  description,
  price,
  scentProfile,
  waxType,
  burnTimeHours,
  modelPath,
}: FeaturedProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className={[
        'group flex flex-col rounded-2xl overflow-hidden',
        'border border-[var(--theme-accent)]/20',
        'bg-[var(--theme-accent)]/5',
        'hover:border-[var(--theme-accent)]/50',
        'hover:bg-[var(--theme-accent)]/10',
        'transition-all duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
      ].join(' ')}
      aria-label={`View ${name}`}
    >
      {/* Candle thumbnail */}
      <div className="aspect-square overflow-hidden bg-[var(--theme-accent)]/10 flex items-center justify-center">
        <svg
          width="72"
          height="96"
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

      {/* Product info */}
      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-semibold text-lg text-[var(--theme-accent)] leading-snug group-hover:opacity-90 transition-opacity">
          {name}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
            {scentProfile}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--theme-accent)]/15 text-[var(--theme-accent)]/80 capitalize">
            {waxType}
          </span>
          <span className="text-xs text-[var(--theme-accent)]/60">
            {burnTimeHours}h burn
          </span>
        </div>

        <p className="text-sm text-[var(--theme-accent)]/60 line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold text-[var(--theme-accent)]">
            {formatZAR(price)}
          </span>
          <span
            className="text-sm font-medium text-[var(--theme-accent)]/70 group-hover:text-[var(--theme-accent)] transition-colors"
            aria-hidden="true"
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
