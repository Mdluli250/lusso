'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubmitReviewInput {
  productId: string;
  rating: number;
  text?: string;
}

export async function submitReview(
  data: SubmitReviewInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'unauthenticated' };
    }

    const userId = session.user.id;
    const { productId, rating, text } = data;

    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be an integer between 1 and 5' };
    }

    // Validate text length
    if (text && text.length > 1000) {
      return { success: false, error: 'Review text must be 1000 characters or less' };
    }

    // Check user has a PAID order containing this product
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'PAID',
      },
      select: { items: true },
    });

    const hasPurchased = orders.some((order) => {
      const items = order.items as Array<{ productId?: string; id?: string }>;
      return items.some(
        (item) => item.productId === productId || item.id === productId
      );
    });

    if (!hasPurchased) {
      return { success: false, error: 'Purchase required to review this product' };
    }

    // Check for existing review (unique constraint on [userId, productId])
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existingReview) {
      return { success: false, error: 'already_reviewed' };
    }

    // Create review with PENDING status
    await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        text: text || null,
        status: 'PENDING',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('submitReview failed:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}
