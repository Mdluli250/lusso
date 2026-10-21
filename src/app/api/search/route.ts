import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search?q=<query>&limit=<n>
 *
 * Full-text search across active products by name, scent profile, wax type,
 * and description. Returns lightweight product cards suitable for the search
 * results dropdown and the full results page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q') ?? '';
  const q = raw.trim().slice(0, 100);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '12', 10) || 12, 1), 50);

  if (!q) {
    return NextResponse.json({ results: [], query: '' });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { scentProfile: { contains: q, mode: 'insensitive' } },
          { waxType: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        scentProfile: true,
        waxType: true,
        image: true,
        images: {
          select: { url: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const results = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      scentProfile: p.scentProfile,
      waxType: p.waxType,
      imageUrl: p.image ?? p.images[0]?.url ?? null,
    }));

    return NextResponse.json({ results, query: q });
  } catch (err) {
    console.error('[Search] Query failed:', err);
    return NextResponse.json({ results: [], query: q });
  }
}
