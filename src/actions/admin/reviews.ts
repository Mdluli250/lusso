'use server';

import { prisma } from '@/lib/prisma';

export async function moderateReview(
  reviewId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { requireAdminSession } = await import('@/lib/admin/auth');
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return { success: false, error: auth.error };
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
