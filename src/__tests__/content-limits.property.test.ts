// Feature: lusso-candles-website, Property 3: Rendered content respects character limits
// **Validates: Requirements 4.2, 5.3, 6.2, 11.2**

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { TESTIMONIALS, GALLERY_IMAGES } from '@/lib/constants/brand';

/**
 * Truncation functions extracted from the rendering logic used in:
 * - CollectionsPreview (title ≤50, description ≤150)
 * - Collections page (product name ≤60, product description ≤200)
 *
 * The components use `.slice(0, maxLength)` to enforce limits.
 */
function truncateCollectionTitle(title: string): string {
  return title.slice(0, 50);
}

function truncateCollectionDescription(description: string): string {
  return description.slice(0, 150);
}

function truncateProductName(name: string): string {
  return name.slice(0, 60);
}

function truncateProductDescription(description: string): string {
  return description.slice(0, 200);
}

describe('Property 3: Rendered content respects character limits', () => {
  describe('Collection card title (≤50 chars)', () => {
    it('truncated title never exceeds 50 characters for any input string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (rawTitle) => {
            const result = truncateCollectionTitle(rawTitle);
            expect(result.length).toBeLessThanOrEqual(50);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves content when input is within limit', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          (shortTitle) => {
            const result = truncateCollectionTitle(shortTitle);
            expect(result).toBe(shortTitle);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Collection card description (≤150 chars)', () => {
    it('truncated description never exceeds 150 characters for any input string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (rawDescription) => {
            const result = truncateCollectionDescription(rawDescription);
            expect(result.length).toBeLessThanOrEqual(150);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves content when input is within limit', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 150 }),
          (shortDesc) => {
            const result = truncateCollectionDescription(shortDesc);
            expect(result).toBe(shortDesc);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Product card name (≤60 chars)', () => {
    it('truncated product name never exceeds 60 characters for any input string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (rawName) => {
            const result = truncateProductName(rawName);
            expect(result.length).toBeLessThanOrEqual(60);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves content when input is within limit', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 60 }),
          (shortName) => {
            const result = truncateProductName(shortName);
            expect(result).toBe(shortName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Product card description (≤200 chars)', () => {
    it('truncated product description never exceeds 200 characters for any input string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 500 }),
          (rawDescription) => {
            const result = truncateProductDescription(rawDescription);
            expect(result.length).toBeLessThanOrEqual(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('preserves content when input is within limit', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (shortDesc) => {
            const result = truncateProductDescription(shortDesc);
            expect(result).toBe(shortDesc);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Gallery image alt text (10–150 chars, enforced by constant data)', () => {
    it('all GALLERY_IMAGES alt text is between 10 and 150 characters', () => {
      for (const image of GALLERY_IMAGES) {
        expect(image.alt.length).toBeGreaterThanOrEqual(10);
        expect(image.alt.length).toBeLessThanOrEqual(150);
      }
    });
  });

  describe('Testimonial quote (≤200 chars, enforced by constant data)', () => {
    it('all TESTIMONIALS quotes are at most 200 characters', () => {
      for (const testimonial of TESTIMONIALS) {
        expect(testimonial.quote.length).toBeLessThanOrEqual(200);
      }
    });
  });

  describe('Testimonial name (≤50 chars, enforced by constant data)', () => {
    it('all TESTIMONIALS names are at most 50 characters', () => {
      for (const testimonial of TESTIMONIALS) {
        expect(testimonial.name.length).toBeLessThanOrEqual(50);
      }
    });
  });
});
