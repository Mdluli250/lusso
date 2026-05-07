'use client';

/**
 * VariantSelector — renders swatch buttons for each ProductVariant.
 *
 * - Highlights the currently selected variant
 * - On hover, preloads the variant's .glb model via useGLTF.preload()
 * - On click, emits the selected variant via the onSelect callback
 *
 * Requirements: 5.3, 5.4
 */

import { useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ProductVariant } from './types';

// ─── Types ────────────────────────────────────────────────────────

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (variant: ProductVariant) => void;
}

// ─── VariantSelector ──────────────────────────────────────────────

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const handleHover = useCallback((modelPath: string) => {
    // Prefetch the .glb model on hover to minimize swap latency
    useGLTF.preload(modelPath);
  }, []);

  if (variants.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-[var(--theme-accent)]/70">
        Select Variant
      </span>

      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Product variants">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isOutOfStock = variant.stock === 0;

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${variant.scent} ${variant.waxType}${isOutOfStock ? ' (out of stock)' : ''}`}
              disabled={isOutOfStock}
              onClick={() => onSelect(variant)}
              onMouseEnter={() => handleHover(variant.modelPath)}
              onFocus={() => handleHover(variant.modelPath)}
              className={[
                'relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl',
                'border-2 transition-all duration-200',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)]',
                isSelected
                  ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/15 shadow-md'
                  : 'border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 hover:border-[var(--theme-accent)]/50 hover:bg-[var(--theme-accent)]/10',
                isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {/* Color swatch */}
              <span
                className="w-8 h-8 rounded-full border border-[var(--theme-accent)]/30 shadow-inner"
                style={{ backgroundColor: variant.colorHex }}
                aria-hidden="true"
              />

              {/* Variant label */}
              <span className="text-xs font-medium text-[var(--theme-accent)]/80 capitalize text-center leading-tight">
                {variant.scent}
              </span>
              <span className="text-[10px] text-[var(--theme-accent)]/50 capitalize">
                {variant.waxType}
              </span>

              {/* Out of stock badge */}
              {isOutOfStock && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/80 text-white">
                  OOS
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--theme-accent)] flex items-center justify-center"
                  aria-hidden="true"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2 2 4-4"
                      stroke="var(--theme-bg)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
