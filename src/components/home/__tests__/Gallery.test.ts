/**
 * Unit tests for the homepage Gallery component's data fetching and fallback logic.
 *
 * The Gallery component is an async server component that:
 * 1. Fetches active gallery images from the database via getActiveGalleryImages()
 * 2. Falls back to the static GALLERY_IMAGES constant when the query returns empty
 * 3. Falls back to the static GALLERY_IMAGES constant when the query throws an error
 *
 * Since this is a server component, we test the data-fetching logic by mocking
 * the query function and verifying the images array used for rendering.
 *
 * **Validates: Requirements 2.2, 2.3**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module mock setup ────────────────────────────────────────────────────────

const { mockGetActiveGalleryImages } = vi.hoisted(() => ({
  mockGetActiveGalleryImages: vi.fn(),
}));

vi.mock('@/lib/admin/galleryQueries', () => ({
  getActiveGalleryImages: mockGetActiveGalleryImages,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => props,
}));

import { GALLERY_IMAGES } from '@/lib/constants/brand';
import type { GalleryImageRecord } from '@/types/gallery';

// ─── Helper to extract images from the rendered output ────────────────────────

/**
 * Calls the Gallery component (async function) and extracts the images
 * it would render by inspecting the returned JSX structure.
 *
 * We inspect the component's return value to determine which images it uses.
 */
async function getGalleryImages(): Promise<{ src: string; alt: string; width: number; height: number }[]> {
  // Re-import the module fresh to pick up mock changes
  const { Gallery } = await import('@/components/home/Gallery');
  const result = await Gallery();

  // The component returns a <section> with a nested grid of images.
  // We navigate the JSX tree to extract image props.
  // result.props.children.props.children[1].props.children contains the mapped images
  const section = result;
  const container = section.props.children; // div.mx-auto
  const gridWrapper = container.props.children[1]; // div.grid (second child after h2)
  const imageElements = gridWrapper.props.children; // array of div wrappers

  return imageElements.map((wrapper: { props: { children: { props: { src: string; alt: string; width: number; height: number } } } }) => {
    const imgProps = wrapper.props.children.props;
    return {
      src: imgProps.src,
      alt: imgProps.alt,
      width: imgProps.width,
      height: imgProps.height,
    };
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Gallery component fallback logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering with database records', () => {
    it('uses database images when active records are returned', async () => {
      const dbRecords: GalleryImageRecord[] = [
        {
          id: 'img-1',
          blobUrl: 'https://blob.store/image-1.png',
          alt: 'Database image one description text',
          width: 1200,
          height: 800,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'img-2',
          blobUrl: 'https://blob.store/image-2.png',
          alt: 'Database image two description text',
          width: 900,
          height: 1100,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockGetActiveGalleryImages.mockResolvedValue(dbRecords);

      const images = await getGalleryImages();

      expect(mockGetActiveGalleryImages).toHaveBeenCalledOnce();
      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        src: 'https://blob.store/image-1.png',
        alt: 'Database image one description text',
        width: 1200,
        height: 800,
      });
      expect(images[1]).toEqual({
        src: 'https://blob.store/image-2.png',
        alt: 'Database image two description text',
        width: 900,
        height: 1100,
      });
    });

    it('maps blobUrl to src field correctly', async () => {
      const dbRecords: GalleryImageRecord[] = [
        {
          id: 'img-url-test',
          blobUrl: 'https://custom-blob.vercel-storage.com/gallery/test.webp',
          alt: 'A test image with a custom blob URL',
          width: 640,
          height: 480,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockGetActiveGalleryImages.mockResolvedValue(dbRecords);

      const images = await getGalleryImages();

      expect(images[0].src).toBe('https://custom-blob.vercel-storage.com/gallery/test.webp');
    });
  });

  describe('fallback to static constant on empty result', () => {
    it('uses GALLERY_IMAGES constant when database returns empty array', async () => {
      mockGetActiveGalleryImages.mockResolvedValue([]);

      const images = await getGalleryImages();

      expect(mockGetActiveGalleryImages).toHaveBeenCalledOnce();
      expect(images).toHaveLength(GALLERY_IMAGES.length);
      expect(images[0]).toEqual({
        src: GALLERY_IMAGES[0].src,
        alt: GALLERY_IMAGES[0].alt,
        width: GALLERY_IMAGES[0].width,
        height: GALLERY_IMAGES[0].height,
      });
    });
  });

  describe('fallback on database error', () => {
    it('uses GALLERY_IMAGES constant when database query throws', async () => {
      mockGetActiveGalleryImages.mockRejectedValue(new Error('Connection refused'));

      const images = await getGalleryImages();

      expect(mockGetActiveGalleryImages).toHaveBeenCalledOnce();
      expect(images).toHaveLength(GALLERY_IMAGES.length);
      expect(images[0]).toEqual({
        src: GALLERY_IMAGES[0].src,
        alt: GALLERY_IMAGES[0].alt,
        width: GALLERY_IMAGES[0].width,
        height: GALLERY_IMAGES[0].height,
      });
    });

    it('does not throw an unhandled exception on database error', async () => {
      mockGetActiveGalleryImages.mockRejectedValue(new Error('Database timeout'));

      // Should not throw — fallback should be used gracefully
      await expect(getGalleryImages()).resolves.not.toThrow();
    });
  });
});
