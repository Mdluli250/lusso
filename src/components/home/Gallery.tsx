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
    <section className="section-spacing bg-sand" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-6xl px-6">
        <h2
          id="gallery-heading"
          className="font-serif text-3xl md:text-4xl text-charcoal mb-8 text-center"
        >
          Gallery
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
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
