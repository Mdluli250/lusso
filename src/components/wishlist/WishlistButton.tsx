'use client';

/**
 * WishlistButton — heart icon toggle for adding/removing products from wishlist.
 *
 * Shows a filled heart when the product is wishlisted, outline when not.
 * Redirects unauthenticated users to sign-in.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWishlistStore } from '@/store/wishlistStore';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const toggle = useWishlistStore((s) => s.toggle);
  // Subscribe to items directly so the component re-renders when the wishlist changes.
  // Using `has` (a function reference) as a selector won't trigger re-renders.
  const items = useWishlistStore((s) => s.items);

  const isWishlisted = items.includes(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    await toggle(productId);
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'inline-flex items-center justify-center',
        'w-9 h-9 rounded-full',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isWishlisted
          ? 'text-red-500 bg-red-500/10'
          : 'text-[var(--theme-accent)]/60 hover:text-red-500 bg-[var(--theme-accent)]/5 hover:bg-red-500/10',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isWishlisted}
    >
      {isWishlisted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
    </button>
  );
}
