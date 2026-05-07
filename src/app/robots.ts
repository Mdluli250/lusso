import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://lusso.co.za';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/checkout', '/success'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
