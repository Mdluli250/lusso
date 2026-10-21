import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { formatZAR } from '@/lib/formatCurrency';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SearchBar } from '@/components/ui/SearchBar';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  return {
    title: q ? `Search: "${q}"` : 'Search',
    description: q ? `Lusso products matching "${q}"` : 'Search the Lusso collection',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? '').trim().slice(0, 100);

  let products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    scentProfile: string;
    image: string | null;
    images: { url: string }[];
  }[] = [];

  if (q) {
    try {
      products = await prisma.product.findMany({
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
          image: true,
          images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        take: 48,
      });
    } catch {
      // DB unavailable — show empty results
    }
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-16">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />

        <header className="mb-10 space-y-6">
          <h1 className="text-4xl font-bold text-[var(--theme-accent)]">
            {q ? `Results for "${q}"` : 'Search'}
          </h1>
          <div className="max-w-lg">
            <SearchBar defaultValue={q} autoFocus={!q} />
          </div>
        </header>

        {q && products.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <p className="text-lg text-[var(--theme-accent)]/70">
              No products found for &ldquo;{q}&rdquo;
            </p>
            <Link
              href="/collection"
              className="inline-block text-sm text-[var(--theme-accent)] underline hover:no-underline"
            >
              Browse all products
            </Link>
          </div>
        )}

        {!q && (
          <p className="text-[var(--theme-accent)]/60 text-lg">
            Enter a search term to find products.
          </p>
        )}

        {products.length > 0 && (
          <>
            <p className="text-sm text-[var(--theme-accent)]/60 mb-8">
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
            <ul
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              role="list"
            >
              {products.map((product) => {
                const imageUrl = product.image ?? product.images[0]?.url ?? null;
                return (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      className="group block rounded-2xl border border-[var(--theme-accent)]/10 overflow-hidden bg-[var(--surface)] hover:border-[var(--theme-accent)]/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--theme-accent)]"
                    >
                      <div className="relative aspect-square bg-[var(--theme-accent)]/5">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[var(--theme-accent)]/20 text-5xl">
                            🕯
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1">
                        <h2 className="font-semibold text-[var(--theme-accent)] group-hover:underline">
                          {product.name}
                        </h2>
                        <p className="text-sm text-[var(--theme-accent)]/60">{product.scentProfile}</p>
                        <p className="text-sm font-medium text-[var(--theme-accent)]">
                          {formatZAR(product.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
