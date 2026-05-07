'use client';

/**
 * ReviewForm — form for submitting product reviews.
 *
 * Includes interactive star rating, textarea with character counter,
 * and submit button. Calls submitReview server action.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useTransition } from 'react';
import { ReviewStars } from './ReviewStars';
import { submitReview } from '@/actions/reviews';
import { Button } from '@/components/ui/Button';

interface ReviewFormProps {
  productId: string;
}

const MAX_TEXT_LENGTH = 1000;

export function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating.' });
      return;
    }

    startTransition(async () => {
      const result = await submitReview({ productId, rating, text: text || undefined });

      if (result.success) {
        setMessage({ type: 'success', text: 'Review submitted! It will appear after moderation.' });
        setRating(0);
        setText('');
      } else {
        const errorMessages: Record<string, string> = {
          unauthenticated: 'Please sign in to leave a review.',
          already_reviewed: 'You have already reviewed this product.',
          'Purchase required to review this product': 'You must purchase this product before reviewing.',
        };
        setMessage({
          type: 'error',
          text: errorMessages[result.error ?? ''] ?? result.error ?? 'Failed to submit review.',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--theme-accent)]/80 mb-2">
          Your Rating
        </label>
        <ReviewStars rating={rating} onChange={setRating} mode="interactive" />
      </div>

      <div>
        <label
          htmlFor="review-text"
          className="block text-sm font-medium text-[var(--theme-accent)]/80 mb-2"
        >
          Your Review (optional)
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
          maxLength={MAX_TEXT_LENGTH}
          rows={4}
          placeholder="Share your experience with this candle..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-bg)] text-[var(--theme-accent)] placeholder:text-[var(--theme-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/30 resize-none"
        />
        <p className="text-xs text-[var(--theme-accent)]/50 mt-1 text-right">
          {text.length}/{MAX_TEXT_LENGTH}
        </p>
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
          role="alert"
        >
          {message.text}
        </p>
      )}

      <Button type="submit" variant="primary" size="sm" disabled={isPending || rating === 0}>
        {isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
