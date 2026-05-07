'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useComparisonStore } from '@/store/comparisonStore';

/**
 * ComparisonBar — Persistent bottom bar showing selected comparison products.
 * Only visible when at least one slot is occupied.
 * Sets a CSS variable on the body so that main content adds bottom padding
 * to prevent the fixed bar from overlapping the footer.
 */
export function ComparisonBar() {
  const slots = useComparisonStore((s) => s.slots);
  const removeProduct = useComparisonStore((s) => s.removeProduct);
  const clear = useComparisonStore((s) => s.clear);
  const filledCount = (slots[0] ? 1 : 0) + (slots[1] ? 1 : 0);

  useEffect(() => {
    if (filledCount > 0) {
      document.documentElement.style.setProperty('--comparison-bar-height', '60px');
    } else {
      document.documentElement.style.setProperty('--comparison-bar-height', '0px');
    }
    return () => {
      document.documentElement.style.setProperty('--comparison-bar-height', '0px');
    };
  }, [filledCount]);

  if (filledCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[var(--theme-bg)] border-t border-[var(--theme-accent)]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Selected products */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {slots.map((slot, index) =>
            slot ? (
              <div
                key={slot.id}
                className="flex items-center gap-2 bg-[var(--theme-accent)]/10 rounded-lg px-3 py-1.5 min-w-0"
              >
                <span className="text-sm text-[var(--theme-accent)] truncate max-w-[120px]">
                  {slot.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeProduct(slot.id)}
                  aria-label={`Remove ${slot.name} from comparison`}
                  className="text-[var(--theme-accent)]/50 hover:text-[var(--theme-accent)] text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={`empty-${index}`}
                className="flex items-center gap-2 border border-dashed border-[var(--theme-accent)]/20 rounded-lg px-3 py-1.5"
              >
                <span className="text-xs text-[var(--theme-accent)]/40">
                  Select a product
                </span>
              </div>
            )
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="text-xs text-[var(--theme-accent)]/60 hover:text-[var(--theme-accent)] transition-colors"
          >
            Clear
          </button>
          <Link
            href="/compare"
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filledCount >= 2
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)]/60 pointer-events-none',
            ].join(' ')}
            aria-disabled={filledCount < 2}
          >
            Compare ({filledCount}/2)
          </Link>
        </div>
      </div>
    </div>
  );
}
