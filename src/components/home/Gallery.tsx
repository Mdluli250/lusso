import Image from 'next/image';
import { GALLERY_IMAGES, type GalleryImage } from '@/lib/constants/brand';
import { getContentJson } from '@/lib/cms/service';

/**
 * Gallery — responsive image grid showcasing candle photography.
 *
 * Async Server Component that fetches gallery images from the CMS.
 * Falls back to the GALLERY_IMAGES constant when the CMS is unavailable
 * or the content block does not exist.
 *
 * Renders images in a responsive grid:
 * - 1 column below 640px
 * - 2 columns from 640px to 1023px
 * - 3 columns at 1024px and above
 *
 * Images below the fold use loading="lazy" to avoid blocking page render.
 *
 * Requirements: 2.1, 2.2, 2.3, 7.6
 */
export async function Gallery() {
  const images = await getContentJson<GalleryImage[]>('gallery_images', [...GALLERY_IMAGES]);

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
