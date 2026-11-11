import Image from "next/image";
import Link from "next/link";
import { CollectionCard } from "@/lib/constants/brand";

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
  collections: CollectionCard[]; // 1-6 items
  heading?: string;
}

export function CollectionsPreview({ collections, heading }: CollectionsPreviewProps) {
  // Handle empty state: render nothing if no collections available
  if (!collections || collections.length === 0) {
    return null;
  }

  // Display up to 6 cards
  const displayedCollections = collections.slice(0, 6);

  return (
    <section
      className="section-spacing bg-sand"
      aria-labelledby="collections-preview-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="collections-preview-heading"
          className="font-serif text-2xl sm:text-3xl text-charcoal text-center mb-3"
        >
          {heading || "Our Collections"}
        </h2>
        <p className="text-warm-grey text-center text-sm lg:text-base mb-8 lg:mb-12 max-w-xl mx-auto">
          Handcrafted in small batches using premium waxes and fine fragrances.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayedCollections.map((collection) => (
            <article
              key={collection.filterParam}
              className="group flex flex-col rounded-2xl overflow-hidden bg-cream shadow-sm border border-[var(--brand-sand)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative aspect-[3/2] w-full overflow-hidden">
                <Image
                  src={collection.imageUrl}
                  alt={`${collection.title} collection`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Subtle gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="flex flex-col flex-1 p-5 lg:p-6">
                <h3 className="font-serif text-lg text-charcoal mb-2">
                  {collection.title.slice(0, 50)}
                </h3>

                <p className="text-warm-grey text-sm leading-relaxed mb-5 flex-1">
                  {collection.description.slice(0, 130)}
                </p>

                <Link
                  href="/collection"
                  style={{ color: 'var(--theme-bg)' }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-theme-accent font-semibold text-sm transition-all duration-150 hover:opacity-90 group-hover:gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
                >
                  Explore
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
