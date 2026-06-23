'use client';

/**
 * CartUpsell — "You might also like" section inside the cart drawer.
 * Fetches recommendations based on the first item in the cart.
 * Non-critical: silently hides if no recommendations or fetch fails.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatZAR } from '@/lib/formatCurrency';

interface Rec {
  productId: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
}

export function CartUpsell() {
  const items = useCartStore((s) => s.items);
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    if (items.length === 0) { setRecs([]); return; }
    const productId = items[0].productId;
    if (productId.startsWith('bundle-')) return;

    let cancelled = false;
    fetch(`/api/recommendations/${encodeURIComponent(productId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        const results: Rec[] = (Array.isArray(data) ? data : []).slice(0, 3);
        setRecs(results.map((r: any) => ({
          productId: r.productId,
          name: r.name,
          slug: r.slug,
          price: r.price,
          scentProfile: r.scentProfile,
        })));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [items]);

  if (recs.length === 0) return null;

  return (
    <div className="border-t border-[var(--theme-accent)]/10 pt-4 mt-4">
      <p className="text-xs font-semibold text-[var(--theme-accent)]/50 uppercase tracking-wide mb-3">
        You might also like
      </p>
      <div className="space-y-2">
        {recs.map((rec) => (
          <Link
            key={rec.productId}
            href={`/products/${rec.slug}`}
            className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-[var(--theme-accent)]/5 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--theme-accent)] line-clamp-1 group-hover:underline">
                {rec.name}
              </p>
              <p className="text-xs text-[var(--theme-accent)]/50 capitalize">{rec.scentProfile}</p>
            </div>
            <span className="text-sm font-semibold text-[var(--theme-accent)] shrink-0">
              {formatZAR(rec.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
