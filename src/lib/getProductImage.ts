/**
 * Maps a product to a gallery image based on its ID.
 * Since we don't have per-product photos, we cycle through available gallery images
 * using a hash of the product ID for consistent assignment.
 */

const PRODUCT_IMAGES = [
  '/images/gallery/candle-closeup-1.png',
  '/images/gallery/styled-trio-1.png',
  '/images/gallery/candle-closeup-2.png',
  '/images/gallery/styled-trio-2.png',
  '/images/gallery/overhead-workspace.png',
  '/images/gallery/overhead-gift-set.png',
];

export function getProductImage(productId: string): string {
  // Use a hash of the product ID to consistently assign an image
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PRODUCT_IMAGES.length;
  return PRODUCT_IMAGES[index];
}
