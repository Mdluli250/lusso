import Image from 'next/image';
import { GALLERY_IMAGES } from '@/lib/constants/brand';

/**
 * Gallery — responsive image grid showcasing candle photography.
 *
 * Server Component (no "use client" directive).
 * Renders images from the GALLERY_IMAGES constant in a responsive grid:
 * - 1 column below 640px
 * - 2 columns from 640px to 1023px
 * - 3 columns at 1024px and above
 *
 * Images below the fold use loading="lazy" to avoid blocking page render.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function Gallery() {
  return (
    <section className="section-spacing bg-sand" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-6xl px-6">
        <h2
          id="gallery-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal mb-8 text-center"
        >
          Gallery
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GALLERY_IMAGES.map((image, index) => (
            <div key={image.src} className="overflow-hidden rounded-lg">
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading={index < 2 ? 'eager' : 'lazy'}
                className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
