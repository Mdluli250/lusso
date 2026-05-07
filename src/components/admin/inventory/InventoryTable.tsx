'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { InlineStockEditor } from './InlineStockEditor';

type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock';

interface InventoryVariant {
  id: string;
  productName: string;
  scent: string;
  waxType: string;
  stock: number;
  stockStatus: StockStatus;
}

interface InventoryTableProps {
  variants: InventoryVariant[];
  currentFilter: string;
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'out-of-stock', label: 'Out of Stock' },
  { value: 'low-stock', label: 'Low Stock' },
];

/**
 * InventoryTable — Client Component for displaying and filtering inventory variants.
 * Shows product name, scent, wax type, stock level with inline editor, and status indicator.
 * Filter buttons update URL params to trigger server-side filtering.
 *
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */
export function InventoryTable({ variants, currentFilter }: InventoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFilterChange(filter: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    router.push(`/admin/inventory?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className={[
              'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
              currentFilter === opt.value
                ? 'border-theme-accent bg-theme-accent/10 text-theme-accent'
                : 'border-border bg-surface text-muted hover:text-foreground hover:border-foreground/30',
            ].join(' ')}
            aria-pressed={currentFilter === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">Product</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Scent</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Wax Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No variants found
                </td>
              </tr>
            ) : (
              variants.map((variant) => (
                <tr
                  key={variant.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-muted/50 transition-colors"
                >
                  <td className="px-4 py-3 text-foreground font-medium">
                    {variant.productName}
                  </td>
                  <td className="px-4 py-3 text-foreground">{variant.scent}</td>
                  <td className="px-4 py-3 text-foreground">{variant.waxType}</td>
                  <td className="px-4 py-3">
                    <InlineStockEditor
                      variantId={variant.id}
                      initialStock={variant.stock}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={variant.stockStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
