'use client';

/**
 * WishlistRemoveButton — client component for removing items from wishlist.
 * Calls the toggleWishlist server action to remove the product.
 */

import { useTransition } from 'react';
import { toggleWishlist } from '@/actions/wishlist';
import { useRouter } from 'next/navigation';

interface WishlistRemoveButtonProps {
  productId: string;
}

export function WishlistRemoveButton({ productId }: WishlistRemoveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRemove = () => {
    startTransition(async () => {
      await toggleWishlist(productId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="text-sm px-3 py-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      aria-label="Remove from wishlist"
    >
      {isPending ? 'Removing...' : 'Remove'}
    </button>
  );
}
