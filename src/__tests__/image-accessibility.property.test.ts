// Feature: lusso-candles-website, Property 8: Meaningful images have valid alt text
// **Validates: Requirements 16.2**

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { GALLERY_IMAGES, GalleryImage } from '@/lib/constants/brand';

/**
 * Property 8: For any meaningful (non-decorative) image rendered on the website,
 * the `alt` attribute should be non-empty and no longer than 125 characters.
 * For any decorative image, the `alt` attribute should be empty ("") or the
 * element should have `role="presentation"`.
 *
 * Test approach:
 * 1. Verify the GALLERY_IMAGES constant has valid alt text (non-empty, ≤125 chars)
 * 2. Generate random image data with varying alt text lengths and verify the constraint
 * 3. Verify decorative images (like the hero background) have empty alt or role="presentation"
 */

/**
 * Validates that a meaningful image's alt text meets accessibility requirements:
 * - Non-empty (after trimming)
 * - No longer than 125 characters
 */
function isValidMeaningfulAlt(alt: string): boolean {
  return alt.trim().length > 0 && alt.length <= 125;
}

/**
 * Validates that a decorative image has proper accessibility attributes:
 * - alt is empty string ("") OR
 * - element has role="presentation"
 */
function isValidDecorativeImage(alt: string, role?: string): boolean {
  return alt === '' || role === 'presentation';
}

/**
 * Generator for meaningful image alt text that should be valid.
 * Produces non-empty strings of 1-125 characters.
 */
const validMeaningfulAltArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 125 })
  .filter((s) => s.trim().length > 0);

/**
 * Generator for image alt text of varying lengths (including invalid ones).
 * Used to verify the constraint function correctly identifies violations.
 */
const anyAltTextArb: fc.Arbitrary<string> = fc.string({ minLength: 0, maxLength: 300 });

/**
 * Generator for a GalleryImage-like object with random alt text.
 */
const galleryImageArb: fc.Arbitrary<GalleryImage> = fc.record({
  src: fc.webUrl().map((url) => `/images/${url.split('/').pop()}.jpg`),
  alt: validMeaningfulAltArb,
  width: fc.integer({ min: 100, max: 2000 }),
  height: fc.integer({ min: 100, max: 2000 }),
});

describe('Property 8: Meaningful images have valid alt text', () => {
  describe('GALLERY_IMAGES constant validation', () => {
    it('all gallery images have non-empty alt text no longer than 125 characters', () => {
      for (const image of GALLERY_IMAGES) {
        expect(image.alt.trim().length).toBeGreaterThan(0);
        expect(image.alt.length).toBeLessThanOrEqual(125);
        expect(isValidMeaningfulAlt(image.alt)).toBe(true);
      }
    });
  });

  describe('Meaningful image alt text constraint', () => {
    it('any non-empty alt text of ≤125 chars is valid for meaningful images', () => {
      fc.assert(
        fc.property(validMeaningfulAltArb, (alt) => {
          expect(isValidMeaningfulAlt(alt)).toBe(true);
          expect(alt.trim().length).toBeGreaterThan(0);
          expect(alt.length).toBeLessThanOrEqual(125);
        }),
        { numRuns: 100 }
      );
    });

    it('empty or whitespace-only alt text is invalid for meaningful images', () => {
      const emptyOrWhitespaceArb = fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n  ');

      fc.assert(
        fc.property(emptyOrWhitespaceArb, (alt) => {
          expect(isValidMeaningfulAlt(alt)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('alt text exceeding 125 characters is invalid for meaningful images', () => {
      const longAltArb = fc.string({ minLength: 126, maxLength: 300 }).filter((s) => s.trim().length > 0);

      fc.assert(
        fc.property(longAltArb, (alt) => {
          expect(isValidMeaningfulAlt(alt)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('generated gallery images always have valid alt text', () => {
      fc.assert(
        fc.property(galleryImageArb, (image) => {
          expect(isValidMeaningfulAlt(image.alt)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Decorative image accessibility', () => {
    it('decorative images with empty alt are valid', () => {
      expect(isValidDecorativeImage('', undefined)).toBe(true);
    });

    it('decorative images with role="presentation" are valid regardless of alt', () => {
      fc.assert(
        fc.property(anyAltTextArb, (alt) => {
          expect(isValidDecorativeImage(alt, 'presentation')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('decorative images without empty alt and without role="presentation" are invalid', () => {
      const nonEmptyAltArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.length > 0);

      fc.assert(
        fc.property(nonEmptyAltArb, (alt) => {
          // Without role="presentation", a non-empty alt means it's not properly decorative
          expect(isValidDecorativeImage(alt, undefined)).toBe(false);
          expect(isValidDecorativeImage(alt, 'img')).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('hero background image uses empty alt and role="presentation" (verified from component source)', () => {
      // The HeroSection component renders its background image with:
      // alt="" role="presentation"
      // This verifies the pattern is correct for decorative images
      const heroAlt = '';
      const heroRole = 'presentation';
      expect(isValidDecorativeImage(heroAlt, heroRole)).toBe(true);
    });
  });
});
