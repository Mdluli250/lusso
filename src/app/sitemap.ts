import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://lusso.co.za';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                        lastModified: new Date(), changeFrequency: 'weekly',  priority: 1   },
    { url: `${baseUrl}/collection`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/search`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/quiz`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/bundle`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/compare`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/about`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/experiences`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
  ];

  try {
    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { scentProfile: true, waxType: true, updatedAt: true },
      }),
    ]);

    // Product detail pages
    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Collection filter pages (unique scent profiles + wax types)
    const scentProfiles = [...new Set(collections.map((c) => c.scentProfile).filter(Boolean))];
    const waxTypes = [...new Set(collections.map((c) => c.waxType).filter(Boolean))];

    const collectionPages: MetadataRoute.Sitemap = [
      ...scentProfiles.map((scent) => ({
        url: `${baseUrl}/collection?scent=${encodeURIComponent(scent)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
      ...waxTypes.map((wax) => ({
        url: `${baseUrl}/collection?wax=${encodeURIComponent(wax)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ];

    return [...staticPages, ...productPages, ...collectionPages];
  } catch {
    // DB unavailable — return static pages only
    return staticPages;
  }
}
