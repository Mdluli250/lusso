import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wishlist — returns the authenticated user's wishlist with product details.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          scentProfile: true,
          variants: {
            select: { modelPath: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const items = wishlistItems.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    slug: item.product.slug,
    price: item.product.price,
    scentProfile: item.product.scentProfile,
    modelPath: item.product.variants[0]?.modelPath ?? null,
  }));

  return NextResponse.json({ items });
}
