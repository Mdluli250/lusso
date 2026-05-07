import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/recently-viewed — returns the authenticated user's recently viewed products
 * (up to 10, sorted by viewedAt desc) with product details.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recentlyViewed = await prisma.recentlyViewed.findMany({
    where: { userId: session.user.id },
    orderBy: { viewedAt: 'desc' },
    take: 10,
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
  });

  const items = recentlyViewed.map((entry) => ({
    productId: entry.productId,
    viewedAt: entry.viewedAt.toISOString(),
    name: entry.product.name,
    slug: entry.product.slug,
    price: entry.product.price,
    scentProfile: entry.product.scentProfile,
    modelPath: entry.product.variants[0]?.modelPath ?? null,
  }));

  return NextResponse.json({ items });
}

/**
 * POST /api/recently-viewed — upserts a RecentlyViewed entry for the authenticated user.
 * Updates viewedAt if the entry already exists, creates it otherwise.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    await prisma.recentlyViewed.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recently viewed upsert failed:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
