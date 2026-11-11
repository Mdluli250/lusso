import Image from 'next/image';
import { GALLERY_IMAGES, type GalleryImage } from '@/lib/constants/brand';
import { getActiveGalleryImages } from '@/lib/admin/galleryQueries';

/**
 * Gallery — responsive image grid showcasing candle photography.
 *
 * Async Server Component that fetches active gallery images from the database.
 * Falls back to the GALLERY_IMAGES constant when the database query fails
 * or returns no active records.
 *
 * Renders images in a responsive grid:
 * - 1 column below 640px
 * - 2 columns from 640px to 1023px
 * - 3 columns at 1024px and above
 *
 * Images below the fold use loading="lazy" to avoid blocking page render.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function Gallery() {
  let images: GalleryImage[];

  try {
    const dbImages = await getActiveGalleryImages();

    if (dbImages.length > 0) {
      // Map GalleryImageRecord fields to the existing render format
      images = dbImages.map((record) => ({
        src: record.blobUrl,
        alt: record.alt,
        width: record.width,
        height: record.height,
      }));
    } else {
      // Fall back to static constant if no active records exist
      images = GALLERY_IMAGES;
    }
  } catch {
    // Fall back to static constant on database error
    images = GALLERY_IMAGES;
  }

  return (
    <section className="section-spacing bg-cream" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <h2
          id="gallery-heading"
          className="font-serif text-2xl sm:text-3xl text-charcoal mb-3 text-center"
        >
          Gallery
        </h2>
        <p className="text-warm-grey text-center text-sm lg:text-base mb-8 lg:mb-10 max-w-xl mx-auto">
          A glimpse into the warmth we craft.
        </p>

        {/* Masonry-style grid: alternating aspect ratios for visual rhythm */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {images.map((image, index) => (
            <div
              key={image.src}
              className={[
                "overflow-hidden rounded-2xl relative group",
                // Every 3rd image (0-indexed: 2, 5, ...) gets a taller aspect on desktop
                index % 3 === 2 ? "aspect-[3/4]" : "aspect-[4/5]",
              ].join(" ")}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                loading={index < 4 ? 'eager' : 'lazy'}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
