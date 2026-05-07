import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRecommendations } from '@/lib/recommendations';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * GET /api/recommendations/[productId] — Get "Customers Also Bought" recommendations.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { productId } = await params;

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  try {
    const recommendations = await getRecommendations(productId);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.warn('Recommendations fetch failed:', error);
    return NextResponse.json([]);
  }
}
