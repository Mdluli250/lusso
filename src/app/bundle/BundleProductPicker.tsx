'use client';

/**
 * BundleProductPicker — list of available products to add to the bundle.
 */

import { useState } from 'react';
import { useBundleStore } from '@/store/bundleStore';
import { Button } from '@/components/ui/Button';
import { formatZAR } from '@/lib/formatCurrency';

interface PickerProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  modelPath: string;
  variantId: string;
}

interface BundleProductPickerProps {
  products: PickerProduct[];
}

export function BundleProductPicker({ products }: BundleProductPickerProps) {
  const addItem = useBundleStore((s) => s.addItem);
  const items = useBundleStore((s) => s.items);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdd = (product: PickerProduct) => {
    const result = addItem({
      productId: product.id,
      variantId: product.variantId,
      name: product.name,
      scent: product.scentProfile,
      price: product.price,
      modelPath: product.modelPath,
    });

    if (!result.success) {
      setErrorMsg(result.error ?? 'Could not add to bundle');
      setTimeout(() => setErrorMsg(null), 3000);
    } else {
      setErrorMsg(null);
    }
  };

  const isInBundle = (productId: string) =>
    items.some((i) => i.productId === productId);

  const isFull = items.length >= 3;

  return (
    <div>
      {errorMsg && (
        <p className="text-sm text-red-500 mb-4" role="alert">
          {errorMsg}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {products.map((product) => {
          const inBundle = isInBundle(product.id);
          return (
            <div
              key={product.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--theme-accent)] line-clamp-1">
                  {product.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--theme-accent)]/60 capitalize">
                    {product.scentProfile}
                  </span>
                  <span className="text-sm font-bold text-[var(--theme-accent)]">
                    {formatZAR(product.price)}
                  </span>
                </div>
              </div>

              <Button
                variant={inBundle ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => handleAdd(product)}
                disabled={inBundle || isFull}
              >
                {inBundle ? 'Added' : 'Add'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
