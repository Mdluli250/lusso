'use client';

/**
 * ReviewList — displays approved reviews for a product.
 *
 * Fetches reviews from the API and displays reviewer name, stars,
 * text, and relative timestamp.
 *
 * Requirements: 4.3, 4.4
 */

import { useEffect, useState } from 'react';
import { ReviewStars } from './ReviewStars';

interface Review {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  user: {
    name: string | null;
  };
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  count: number;
}

interface ReviewListProps {
  productId: string;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export function ReviewList({ productId }: ReviewListProps) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews/${productId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail — reviews are non-critical
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-16 rounded-lg bg-[var(--theme-accent)]/5" />
        ))}
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--theme-accent)]/50">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 mb-4">
        <ReviewStars rating={data.averageRating} mode="display" size="sm" />
        <span className="text-sm text-[var(--theme-accent)]/70">
          {data.averageRating.toFixed(1)} ({data.count} review{data.count !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Review items */}
      {data.reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 rounded-lg border border-[var(--theme-accent)]/10 bg-[var(--theme-accent)]/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--theme-accent)]">
                {review.user.name ?? 'Anonymous'}
              </span>
              <ReviewStars rating={review.rating} mode="display" size="sm" />
            </div>
            <span className="text-xs text-[var(--theme-accent)]/50">
              {getRelativeTime(review.createdAt)}
            </span>
          </div>
          {review.text && (
            <p className="text-sm text-[var(--theme-accent)]/70">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
