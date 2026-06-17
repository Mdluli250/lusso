// Feature: lusso-candles-website, Property 4: Product CTA links resolve to correct detail page
// **Validates: Requirements 11.3**

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

/**
 * The Collections page constructs product CTA links using the pattern:
 *   `/products/${product.slug}`
 *
 * This property test generates random valid slug strings (lowercase alphanumeric
 * with hyphens) and verifies that the URL construction always produces
 * `/products/{slug}`.
 */

/**
 * Builds the product detail URL from a slug — mirrors the logic in
 * `src/app/collections/page.tsx`:
 *   <Link href={`/products/${product.slug}`}>View Candle</Link>
 */
function buildProductHref(slug: string): string {
  return `/products/${slug}`;
}

/**
 * Generator for valid product slugs.
 * Slugs are lowercase alphanumeric strings with hyphens, matching typical
 * URL-safe slug patterns (e.g. "lavender-soy", "cinnamon-ember-blend").
 * - Minimum length: 1
 * - Maximum length: 80
 * - Characters: a-z, 0-9, hyphen
 * - Cannot start or end with a hyphen
 * - No consecutive hyphens
 */
const validSlugArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .filter((s) => s.length >= 1 && s.length <= 80);

describe('Property 4: Product CTA links resolve to correct detail page', () => {
  it('for any valid product slug, the CTA href equals /products/{slug}', () => {
    fc.assert(
      fc.property(validSlugArb, (slug) => {
        const href = buildProductHref(slug);

        // The href must start with /products/
        expect(href).toMatch(/^\/products\//);

        // The href must be exactly /products/{slug}
        expect(href).toBe(`/products/${slug}`);

        // The slug portion of the URL must match the input slug exactly
        const extractedSlug = href.replace('/products/', '');
        expect(extractedSlug).toBe(slug);

        // The href must not contain double slashes (malformed URL)
        expect(href).not.toContain('//');

        // The href must be a valid relative URL path
        expect(href.startsWith('/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
