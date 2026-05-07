'use client';

/**
 * RecentlyViewed — horizontal scrollable list of up to 6 recently viewed products.
 *
 * Uses useRecentlyViewedStore for data. Each item links to the product detail page.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  scentProfile: string;
  price: number;
}

export function RecentlyViewed() {
  const getDisplayItems = useRecentlyViewedStore((s) => s.getDisplayItems);
  const items = useRecentlyViewedStore((s) => s.items);
  const [products, setProducts] = useState<ProductInfo[]>([]);

  const displayItems = getDisplayItems();

  useEffect(() => {
    if (displayItems.length === 0) return;

    // Fetch product details for display items
    async function fetchProducts() {
      try {
        const ids = displayItems.map((i) => i.productId);
        const res = await fetch(`/api/recently-viewed?ids=${ids.join(',')}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch {
        // Non-critical, silently fail
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (displayItems.length === 0 || products.length === 0) {
    return null;
  }

  return (
    <section aria-label="Recently viewed products">
      <h3 className="text-lg font-semibold text-[var(--theme-accent)] mb-4">
        Recently Viewed
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[var(--theme-accent)]/20">
        {products.slice(0, 6).map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex-shrink-0 w-40 p-3 rounded-xl border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 hover:border-[var(--theme-accent)]/40 hover:bg-[var(--theme-accent)]/8 transition-all duration-200"
          >
            <p className="text-sm font-medium text-[var(--theme-accent)] line-clamp-2">
              {product.name}
            </p>
            <p className="text-xs text-[var(--theme-accent)]/60 capitalize mt-1">
              {product.scentProfile}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
