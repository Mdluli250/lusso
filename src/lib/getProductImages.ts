import { getProductImage } from './getProductImage';

const PRODUCT_IMAGES = [
  '/images/gallery/candle-closeup-1.png',
  '/images/gallery/styled-trio-1.png',
  '/images/gallery/candle-closeup-2.png',
  '/images/gallery/styled-trio-2.png',
  '/images/gallery/overhead-workspace.png',
  '/images/gallery/overhead-gift-set.png',
];

/**
 * Returns 3-4 images for a product by cycling through available gallery images.
 */
export function getProductImages(productId: string): string[] {
  const images: string[] = [];
  for (let i = 0; i < 4; i++) {
    let hash = 0;
    const key = `${productId}-${i}`;
    for (let j = 0; j < key.length; j++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(j);
      hash |= 0;
    }
    const index = Math.abs(hash) % PRODUCT_IMAGES.length;
    images.push(PRODUCT_IMAGES[index]);
  }
  // Deduplicate while maintaining order
  return [...new Set(images)].slice(0, 4);
}
