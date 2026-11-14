'use server';

import { prisma } from '@/lib/prisma';

export async function moderateReview(
  reviewId: string,
  action: 'APPROVE' | 'REJECT'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { requireAdminSession } = await import('@/lib/admin/auth');
    const auth = await requireAdminSession();
    if (!auth.ok) return { success: false, error: auth.error };

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: 'Review not found' };

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    });

    return { success: true };
  } catch (error) {
    console.error('moderateReview failed:', error);
    return { success: false, error: 'Failed to moderate review' };
  }
}

// ─── Featured reviews ─────────────────────────────────────────────
// Featured review IDs are stored as JSON in ContentBlock records so no
// schema migration is needed.
// Keys: "featured_reviews_home"  → array of review IDs shown on homepage
//       "featured_reviews_product" → array of review IDs shown on products

type FeaturedKey = 'featured_reviews_home' | 'featured_reviews_product';

async function getFeaturedIds(key: FeaturedKey): Promise<string[]> {
  try {
    const block = await prisma.contentBlock.findUnique({ where: { key } });
    if (!block) return [];
    return JSON.parse(block.value) as string[];
  } catch {
    return [];
  }
}

async function setFeaturedIds(key: FeaturedKey, ids: string[]): Promise<void> {
  await prisma.contentBlock.upsert({
    where: { key },
    create: { key, type: 'json', value: JSON.stringify(ids), label: key },
    update: { value: JSON.stringify(ids) },
  });
}

export async function toggleFeaturedReview(
  reviewId: string,
  target: 'home' | 'product'
): Promise<{ success: boolean; featured: boolean; error?: string }> {
  try {
    const { requireAdminSession } = await import('@/lib/admin/auth');
    const auth = await requireAdminSession();
    if (!auth.ok) return { success: false, featured: false, error: auth.error };

    const key: FeaturedKey =
      target === 'home' ? 'featured_reviews_home' : 'featured_reviews_product';

    const ids = await getFeaturedIds(key);
    const isFeatured = ids.includes(reviewId);
    const updated = isFeatured
      ? ids.filter((id) => id !== reviewId)
      : [...ids, reviewId];

    await setFeaturedIds(key, updated);
    return { success: true, featured: !isFeatured };
  } catch (error) {
    console.error('toggleFeaturedReview failed:', error);
    return { success: false, featured: false, error: 'Failed to update featured reviews' };
  }
}

export async function getFeaturedReviewIds(
  target: 'home' | 'product'
): Promise<string[]> {
  const key: FeaturedKey =
    target === 'home' ? 'featured_reviews_home' : 'featured_reviews_product';
  return getFeaturedIds(key);
}
