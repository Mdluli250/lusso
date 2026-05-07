'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateVariantStock } from '@/actions/admin/inventory';

interface InlineStockEditorProps {
  variantId: string;
  initialStock: number;
}

/**
 * InlineStockEditor — Client Component for inline stock level editing.
 * Shows a number input with the current stock value. When the value changes,
 * a Save button appears. On save, calls the updateVariantStock Server Action.
 * Displays a spinner during save and an error message on failure.
 *
 * Requirements: 9.2
 */
export function InlineStockEditor({ variantId, initialStock }: InlineStockEditorProps) {
  const [stock, setStock] = useState(initialStock);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const hasChanged = stock !== initialStock;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateVariantStock(variantId, stock);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={stock}
        onChange={(e) => {
          setStock(Math.max(0, parseInt(e.target.value, 10) || 0));
          setError(null);
        }}
        className="w-16 px-2 py-1 text-sm rounded border border-border bg-surface text-foreground text-center focus:border-theme-accent transition-colors"
        aria-label="Stock quantity"
        disabled={isPending}
      />

      {hasChanged && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-2 py-1 text-xs font-medium rounded bg-theme-accent text-white hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-1">
              <svg
                className="animate-spin h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving
            </span>
          ) : (
            'Save'
          )}
        </button>
      )}

      {error && (
        <span className="text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
