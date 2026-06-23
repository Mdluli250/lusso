'use client';

/**
 * BundleSlot — individual slot in the bundle builder.
 *
 * Shows filled state (product info + remove button) or empty state (dashed border placeholder).
 *
 * Requirements: 7.1, 7.2
 */

import Image from 'next/image';
import type { BundleItem } from '@/store/bundleStore';

interface BundleSlotProps {
  item: BundleItem | null;
  index: number;
  onRemove?: (productId: string) => void;
}

export function BundleSlot({ item, index, onRemove }: BundleSlotProps) {
  if (!item) {
    return (
      <div
        className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
        aria-label={`Empty bundle slot ${index + 1}`}
      >
        <span className="text-sm text-[var(--theme-accent)]/40">
          Slot {index + 1} — Add a candle
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 h-24 px-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5">
      {/* Product image or SVG placeholder */}
      {item.imageUrl ? (
        <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      ) : (
        <svg
          width="40"
          height="40"
          viewBox="0 0 72 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <ellipse cx="36" cy="10" rx="5" ry="8" fill="var(--theme-accent)" opacity="0.9" />
          <line x1="36" y1="18" x2="36" y2="26" stroke="var(--theme-accent)" strokeWidth="2" strokeLinecap="round" />
          <rect x="18" y="26" width="36" height="58" rx="6" fill="var(--theme-accent)" opacity="0.25" />
          <rect x="18" y="26" width="36" height="58" rx="6" stroke="var(--theme-accent)" strokeWidth="1.5" opacity="0.6" />
          <line x1="24" y1="52" x2="48" y2="52" stroke="var(--theme-accent)" strokeWidth="1" opacity="0.5" />
          <line x1="24" y1="58" x2="44" y2="58" stroke="var(--theme-accent)" strokeWidth="1" opacity="0.4" />
        </svg>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--theme-accent)] line-clamp-1">
          {item.name}
        </p>
        <p className="text-xs text-[var(--theme-accent)]/60 capitalize">
          {item.scent}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(item.productId)}
          className="text-xs px-2 py-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
          aria-label={`Remove ${item.name} from bundle`}
        >
          Remove
        </button>
      )}
    </div>
  );
}
