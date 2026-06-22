import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

/**
 * Collections Page — Server Component.
 *
 * Fetches all active products from Prisma, groups them by scentProfile or waxType,
 * and displays them in a responsive grid. Supports filter query params from
 * Collections Preview CTAs.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Browse all Lusso Candles collections. Discover hand-poured luxury candles grouped by scent profile and wax type.",
};

// ─── Types ────────────────────────────────────────────────────────

interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  waxType: string;
  scentProfile: string;
  image?: string | null;
  images?: { id: string; url: string }[];
  isActive: boolean;
  variants: {
    id: string;
    modelPath: string;
    colorHex: string;
    scent: string;
    waxType: string;
  }[];
}

// ─── Data fetching ────────────────────────────────────────────────

async function getActiveProducts(): Promise<ProductWithVariants[]> {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          select: {
            id: true,
            modelPath: true,
            colorHex: true,
            scent: true,
            waxType: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch {
    // Gracefully handle DB errors — display empty state
    return [];
  }
}

function parseFilter(
  filterParam: string | undefined,
): { key: string; value: string } | null {
  if (!filterParam) return null;
  const decoded = decodeURIComponent(filterParam);
  const [key, value] = decoded.split("=");
  if (key && value && (key === "waxType" || key === "scentProfile")) {
    return { key, value };
  }
  return null;
}

function filterProducts(
  products: ProductWithVariants[],
  filter: { key: string; value: string } | null,
): ProductWithVariants[] {
  if (!filter) return products;
  return products.filter((product) => {
    if (filter.key === "waxType") return product.waxType === filter.value;
    if (filter.key === "scentProfile")
      return product.scentProfile === filter.value;
    return true;
  });
}

// ─── Helper: get a placeholder image for a product ────────────────

function getProductImage(product: ProductWithVariants): string {
  // Prefer an uploaded hero image if present
  if (product.image) return product.image;
  // Prefer a persisted gallery image if there is no hero image
  if (product.images?.[0]?.url) return product.images[0].url;

  // Fallback: use the first variant's model path as a reference, or a placeholder
  const variant = product.variants[0];
  if (variant?.modelPath) {
    return `/images/products/${product.slug}.jpg`;
  }
  return "/images/products/placeholder-candle.jpg";
}

// ─── Page ─────────────────────────────────────────────────────────

interface CollectionsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  const params = await searchParams;
  const products = await getActiveProducts();
  const filter = parseFilter(params.filter);
  const filteredProducts = filterProducts(products, filter);

  return (
    <div className="bg-cream min-h-screen">
      {/* Page Header */}
      <section
        className="section-spacing"
        aria-labelledby="collections-heading"
      >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1
            id="collections-heading"
            className="font-serif text-4xl md:text-5xl text-charcoal mb-4"
          >
            This is our collection
          </h1>
          <p className="text-warm-grey text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Explore our full range of hand-poured luxury candles, crafted with
            care in Centurion, South Africa.
          </p>
          {filter && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-sm text-warm-grey">
                Filtered by:{" "}
                <span className="font-medium text-charcoal">
                  {filter.value}
                </span>
              </span>
              <Link
                href="/collections"
                className="text-sm text-charcoal underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Clear filter
              </Link>
            </div>
          )}
        </div>
      </section>

      <section
        className="section-spacing bg-sand"
        aria-labelledby="collection-groups-heading"
      >
        <div className="mx-auto max-w-6xl px-6">
          <h2
            id="collection-groups-heading"
            className="font-serif text-3xl md:text-4xl text-charcoal text-center mb-10"
          >
            Our Collection
          </h2>

          <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
            <article>
              <h3 className="font-serif text-xl text-charcoal mb-3">
                Kitchen Collection
              </h3>
              <ul className="space-y-2 text-warm-grey text-sm leading-relaxed">
                <li>Citrus Spice Infusion</li>
                <li>Citrus Élan</li>
              </ul>
            </article>

            <article>
              <h3 className="font-serif text-xl text-charcoal mb-3">
                Living Room Collection
              </h3>
              <ul className="space-y-2 text-warm-grey text-sm leading-relaxed">
                <li>Vanilla Soleil</li>
                <li>Cinnamon Vanilla</li>
              </ul>
            </article>

            <article>
              <h3 className="font-serif text-xl text-charcoal mb-3">
                Bedroom Collection
              </h3>
              <ul className="space-y-2 text-warm-grey text-sm leading-relaxed">
                <li>Cashmere Rose Ember</li>
                <li>Peony Rose</li>
              </ul>
            </article>

            <article>
              <h3 className="font-serif text-xl text-charcoal mb-3">
                Gift Collection
              </h3>
              <ul className="space-y-2 text-warm-grey text-sm leading-relaxed">
                <li>Discovery Trio</li>
                <li>Duo Gift Set</li>
                <li>Signature Collection</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section
        className="section-spacing bg-white"
        aria-labelledby="products-grid-heading"
      >
        <h2 id="products-grid-heading" className="sr-only">
          Candle products
        </h2>
        <div className="mx-auto max-w-6xl px-6">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-warm-grey text-lg" role="status">
                No collections currently available
              </p>
              {filter && (
                <Link
                  href="/collections"
                  className="mt-4 inline-flex items-center justify-center px-6 py-3 min-h-[44px] min-w-[120px] rounded-lg bg-charcoal text-white font-semibold text-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  View all collections
                </Link>
              )}
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="list"
              aria-label="Candle collections"
            >
              {filteredProducts.map((product) => (
                <li key={product.id}>
                  <article className="flex flex-col h-full rounded-xl overflow-hidden bg-cream shadow-sm transition-shadow duration-200 hover:shadow-md">
                    <div className="relative aspect-[4/3] w-full bg-sand">
                      <Image
                        src={getProductImage(product)}
                        alt={`${product.name} — ${product.scentProfile} scented ${product.waxType} wax candle`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <h3 className="font-serif text-xl text-charcoal mb-2">
                        {product.name.slice(0, 60)}
                      </h3>

                      <p className="text-warm-grey text-sm leading-relaxed mb-6 flex-1">
                        {product.description.slice(0, 200)}
                      </p>

                      <Link
                        href={`/products/${product.slug}`}
                        className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] min-w-[120px] rounded-lg bg-charcoal text-cream font-semibold text-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                      >
                        View Candle
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
