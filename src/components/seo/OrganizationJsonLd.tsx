export function OrganizationJsonLd() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://lusso.co.za';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lusso',
    url: baseUrl,
    description:
      'Hand-poured luxury candles crafted in South Africa. Elevate everyday living through scent, warmth, and quiet luxury.',
    brand: {
      '@type': 'Brand',
      name: 'Lusso',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ZA',
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
