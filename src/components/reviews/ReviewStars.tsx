'use client';

/**
 * ReviewStars — star rating component with interactive and display modes.
 *
 * - interactive: clickable stars for form input
 * - display: read-only showing average rating
 *
 * Requirements: 3.2, 4.1
 */

import { useState } from 'react';

interface ReviewStarsProps {
  rating?: number;
  onChange?: (rating: number) => void;
  mode: 'interactive' | 'display';
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
};

export function ReviewStars({
  rating = 0,
  onChange,
  mode,
  size = 'md',
}: ReviewStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = mode === 'interactive' ? (hoverRating || rating) : rating;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={mode === 'interactive' ? 'radiogroup' : 'img'}
      aria-label={mode === 'display' ? `Rating: ${rating.toFixed(1)} out of 5 stars` : 'Select rating'}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(displayRating);

        if (mode === 'interactive') {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={star === rating}
            >
              <StarIcon filled={filled} className={sizeClasses[size]} />
            </button>
          );
        }

        return (
          <StarIcon
            key={star}
            filled={filled}
            className={sizeClasses[size]}
          />
        );
      })}
    </div>
  );
}

function StarIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-amber-400 ${className}`}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`text-[var(--theme-accent)]/30 ${className}`}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}
