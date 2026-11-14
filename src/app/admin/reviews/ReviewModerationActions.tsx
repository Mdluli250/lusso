'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReview, toggleFeaturedReview } from '@/actions/admin/reviews';
import { Button } from '@/components/ui/Button';

interface ReviewModerationActionsProps {
  reviewId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  initialFeaturedHome?: boolean;
  initialFeaturedProduct?: boolean;
}

export function ReviewModerationActions({
  reviewId,
  status,
  initialFeaturedHome = false,
  initialFeaturedProduct = false,
}: ReviewModerationActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [featuredHome, setFeaturedHome] = useState(initialFeaturedHome);
  const [featuredProduct, setFeaturedProduct] = useState(initialFeaturedProduct);
  const router = useRouter();

  const handleModerate = (action: 'APPROVE' | 'REJECT') => {
    startTransition(async () => {
      await moderateReview(reviewId, action);
      router.refresh();
    });
  };

  const handleToggleFeatured = (target: 'home' | 'product') => {
    startTransition(async () => {
      const result = await toggleFeaturedReview(reviewId, target);
      if (result.success) {
        if (target === 'home') setFeaturedHome(result.featured);
        else setFeaturedProduct(result.featured);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {/* Moderation buttons — only for PENDING */}
      {status === 'PENDING' && (
        <>
          <Button variant="primary" size="sm" onClick={() => handleModerate('APPROVE')} disabled={isPending}>
            Approve
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleModerate('REJECT')}
            disabled={isPending}
            className="text-red-500 border-red-500/50 hover:bg-red-500/10"
          >
            Reject
          </Button>
        </>
      )}

      {/* Feature toggles — only for APPROVED */}
      {status === 'APPROVED' && (
        <>
          <button
            type="button"
            onClick={() => handleToggleFeatured('home')}
            disabled={isPending}
            title={featuredHome ? 'Remove from homepage' : 'Feature on homepage'}
            className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors',
              featuredHome
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'border-[var(--theme-accent)]/20 text-[var(--theme-accent)]/60 hover:border-amber-300 hover:text-amber-600',
            ].join(' ')}
          >
            <span aria-hidden="true">{featuredHome ? '★' : '☆'}</span>
            Homepage
          </button>
          <button
            type="button"
            onClick={() => handleToggleFeatured('product')}
            disabled={isPending}
            title={featuredProduct ? 'Remove from product pages' : 'Feature on product pages'}
            className={[
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors',
              featuredProduct
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                : 'border-[var(--theme-accent)]/20 text-[var(--theme-accent)]/60 hover:border-blue-300 hover:text-blue-600',
            ].join(' ')}
          >
            <span aria-hidden="true">{featuredProduct ? '📌' : '📍'}</span>
            Product
          </button>
        </>
      )}
    </div>
  );
}
