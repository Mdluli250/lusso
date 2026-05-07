import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reviews/[productId] — returns approved reviews for a product
 * sorted by createdAt desc, with computed averageRating and totalCount.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      text: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  const totalCount = reviews.length;
  const averageRating =
    totalCount > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10
        ) / 10
      : 0;

  return NextResponse.json({
    reviews,
    averageRating,
    totalCount,
  });
}
