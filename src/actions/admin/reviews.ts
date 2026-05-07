'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function moderateReview(
  reviewId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus },
    });

    return { success: true };
  } catch (error) {
    console.error('moderateReview failed:', error);
    return { success: false, error: 'Failed to moderate review' };
  }
}
