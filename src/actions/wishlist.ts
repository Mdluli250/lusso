'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function toggleWishlist(
  productId: string
): Promise<{ wishlisted: boolean } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'unauthenticated' };
  }

  const userId = session.user.id;

  // Check if item already exists in wishlist
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (existing) {
    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return { wishlisted: false };
  } else {
    // Add to wishlist
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    return { wishlisted: true };
  }
}
