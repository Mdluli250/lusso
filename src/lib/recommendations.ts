import { prisma } from '@/lib/prisma';

/**
 * Recommendations engine — "Customers Also Bought" feature.
 * Uses co-purchase analysis from completed orders.
 */

export interface RecommendationResult {
  productId: string;
  name: string;
  slug: string;
  price: number;
  scentProfile: string;
  score: number;
}

// ─── In-memory cache ──────────────────────────────────────────────

const cache = new Map<string, { data: RecommendationResult[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get product recommendations based on co-purchase analysis.
 * Falls back to same scent profile when insufficient data.
 */
export async function getRecommendations(
  productId: string,
  limit = 4
): Promise<RecommendationResult[]> {
  // Check cache
  const cached = cache.get(productId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const coPurchases = await prisma.$queryRaw<RecommendationResult[]>`
      WITH target_orders AS (
        SELECT id, items
        FROM "Order"
        WHERE status = 'PAID'
          AND items::jsonb @> ${JSON.stringify([{ productId }])}::jsonb
      ),
      paired_products AS (
        SELECT 
          elem->>'productId' as "productId",
          COUNT(DISTINCT t.id)::int as score
        FROM target_orders t,
          jsonb_array_elements(t.items::jsonb) as elem
        WHERE elem->>'productId' != ${productId}
        GROUP BY elem->>'productId'
      )
      SELECT 
        pp."productId",
        pp.score,
        p.name,
        p.slug,
        p.price,
        p."scentProfile"
      FROM paired_products pp
      JOIN "Product" p ON p.id = pp."productId"
      WHERE p."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "ProductVariant" pv 
          WHERE pv."productId" = p.id AND pv.stock > 0
        )
      ORDER BY pp.score DESC
      LIMIT ${limit}
    `;

    // If fewer than 2 results, fall back to same scent profile
    if (coPurchases.length < 2) {
      const fallback = await getFallbackRecommendations(productId, limit);
      cache.set(productId, { data: fallback, expiresAt: Date.now() + CACHE_TTL_MS });
      return fallback;
    }

    cache.set(productId, { data: coPurchases, expiresAt: Date.now() + CACHE_TTL_MS });
    return coPurchases;
  } catch (error) {
    console.warn('Recommendations query failed:', error);
    return [];
  }
}

/**
 * Fallback recommendations based on same scent profile.
 */
export async function getFallbackRecommendations(
  productId: string,
  limit: number
): Promise<RecommendationResult[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { scentProfile: true },
  });

  if (!product) return [];

  const results = await prisma.product.findMany({
    where: {
      scentProfile: product.scentProfile,
      id: { not: productId },
      isActive: true,
      variants: { some: { stock: { gt: 0 } } },
    },
    select: { id: true, name: true, slug: true, price: true, scentProfile: true },
    take: limit,
  });

  return results.map((r) => ({
    productId: r.id,
    name: r.name,
    slug: r.slug,
    price: r.price,
    scentProfile: r.scentProfile,
    score: 0,
  }));
}
