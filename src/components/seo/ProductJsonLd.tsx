interface ProductJsonLdProps {
  name: string;
  description: string;
  price: number; // ZAR cents
  slug: string;
  scentProfile: string;
}

export function ProductJsonLd({ name, description, price, slug, scentProfile }: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: { '@type': 'Brand', name: 'Lusso' },
    category: 'Candles',
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'Scent Profile',
      value: scentProfile,
    },
    offers: {
      '@type': 'Offer',
      price: (price / 100).toFixed(2),
      priceCurrency: 'ZAR',
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXTAUTH_URL || 'https://lusso.co.za'}/products/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
