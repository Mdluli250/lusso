'use client';

/**
 * BundleSlot — individual slot in the bundle builder.
 *
 * Shows filled state (product info + remove button) or empty state (dashed border placeholder).
 *
 * Requirements: 7.1, 7.2
 */

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
