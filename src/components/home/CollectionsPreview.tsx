import Image from 'next/image';
import Link from 'next/link';
import { CollectionCard } from '@/lib/constants/brand';

/**
 * CollectionsPreview — displays product line cards on the Home page.
 *
 * Server Component (no "use client" directive).
 * Accepts pre-fetched collection data and renders up to 3 cards.
 * Each card shows a title, description, image, and CTA link to the
 * collections page with the appropriate filter pre-applied.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

interface CollectionsPreviewProps {
  collections: CollectionCard[]; // 1-3 items
}

export function CollectionsPreview({ collections }: CollectionsPreviewProps) {
  // Handle empty state: render nothing if no collections available
  if (!collections || collections.length === 0) {
    return null;
  }

  // Display exactly min(3, N) cards
  const displayedCollections = collections.slice(0, 3);

  return (
    <section
      className="section-spacing bg-sand"
      aria-labelledby="collections-preview-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2
          id="collections-preview-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal text-center mb-10"
        >
          Our Collections
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCollections.map((collection) => (
            <article
              key={collection.filterParam}
              className="flex flex-col rounded-xl overflow-hidden bg-cream shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={collection.imageUrl}
                  alt={`${collection.title} collection`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col flex-1 p-6">
                <h3 className="font-serif text-xl text-charcoal mb-2">
                  {collection.title.slice(0, 50)}
                </h3>

                <p className="text-warm-grey text-sm leading-relaxed mb-6 flex-1">
                  {collection.description.slice(0, 150)}
                </p>

                <Link
                  href={`/collections?filter=${encodeURIComponent(collection.filterParam)}`}
                  className="inline-flex items-center justify-center px-6 py-3 min-h-[44px] min-w-[120px] rounded-lg bg-charcoal text-cream font-semibold text-sm transition-opacity duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  Explore Collection
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
