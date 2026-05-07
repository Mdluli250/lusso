'use client';

import { useComparisonStore, type ComparisonProduct } from '@/store/comparisonStore';

interface CompareButtonProps {
  product: ComparisonProduct;
  className?: string;
}

/**
 * CompareButton — "Compare" toggle button for product cards.
 * Adds/removes a product from the comparison store.
 */
export function CompareButton({ product, className = '' }: CompareButtonProps) {
  const slots = useComparisonStore((s) => s.slots);
  const addProduct = useComparisonStore((s) => s.addProduct);
  const removeProduct = useComparisonStore((s) => s.removeProduct);
  const isInComparison = slots[0]?.id === product.id || slots[1]?.id === product.id;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInComparison) {
      removeProduct(product.id);
    } else {
      addProduct({ ...product, addedAt: Date.now() });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
      aria-pressed={isInComparison}
      className={[
        'px-2 py-1 rounded-md text-xs font-medium transition-all',
        isInComparison
          ? 'bg-[var(--theme-accent)] text-white'
          : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]/70 hover:bg-[var(--theme-accent)]/20',
        className,
      ].join(' ')}
    >
      {isInComparison ? '✓ Comparing' : 'Compare'}
    </button>
  );
}
