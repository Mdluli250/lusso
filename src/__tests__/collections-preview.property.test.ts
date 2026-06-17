// Feature: lusso-candles-website, Property 2: Collections preview card count respects available groupings
// **Validates: Requirements 4.1, 4.3, 4.4**

// @vitest-environment jsdom

import { render } from '@testing-library/react';
import fc from 'fast-check';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props;
    return React.createElement('img', rest);
  },
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => {
    return React.createElement('a', { href, ...props }, children);
  },
}));

import { CollectionsPreview } from '@/components/home/CollectionsPreview';
import { CollectionCard } from '@/lib/constants/brand';

/**
 * Generator for a filter param key (e.g. "waxType", "scentProfile").
 */
const filterKeyArb = fc.constantFrom('waxType', 'scentProfile', 'category', 'material');

/**
 * Generator for a filter param value.
 */
const filterValueArb = fc.constantFrom('soy', 'beeswax', 'coconut', 'floral', 'woody', 'citrus', 'spicy', 'fresh');

/**
 * Generator for a valid CollectionCard object.
 * Produces random titles (1-50 chars), descriptions (1-150 chars),
 * image URLs, and filter params.
 */
const collectionCardArb = (index: number): fc.Arbitrary<CollectionCard> =>
  fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.trim() || `Collection ${index}`),
    description: fc.string({ minLength: 1, maxLength: 150 }).map((s) => s.trim() || `Description ${index}`),
    imageUrl: fc.constant(`/images/collection-${index}.jpg`),
    filterParam: fc.tuple(filterKeyArb, filterValueArb).map(([k, v]) => `${k}=${v}-${index}`),
  });

/**
 * Generator for an array of CollectionCard objects (0-10 items),
 * each with a unique filterParam to simulate distinct groupings.
 */
const collectionsArrayArb: fc.Arbitrary<CollectionCard[]> = fc
  .integer({ min: 0, max: 10 })
  .chain((n) => {
    if (n === 0) return fc.constant([] as CollectionCard[]);
    return fc.tuple(
      ...Array.from({ length: n }, (_, i) => collectionCardArb(i))
    ).map((arr) => arr as CollectionCard[]);
  });

describe('Property 2: Collections preview card count respects available groupings', () => {
  it('renders min(3, N) cards for any collection array of size N, or null when N=0', () => {
    fc.assert(
      fc.property(collectionsArrayArb, (collections) => {
        const N = collections.length;

        const { container } = render(
          React.createElement(CollectionsPreview, { collections })
        );

        if (N === 0) {
          // Component should render nothing
          expect(container.innerHTML).toBe('');
        } else {
          // Should render exactly min(3, N) cards
          const expectedCount = Math.min(3, N);
          const cards = container.querySelectorAll('article');
          expect(cards.length).toBe(expectedCount);

          // Each card's CTA link should have the correct href with filter param
          const links = container.querySelectorAll('a[href*="/collections?filter="]');
          expect(links.length).toBe(expectedCount);

          // Verify each link's href matches the corresponding collection's filterParam
          const displayedCollections = collections.slice(0, 3);
          links.forEach((link, i) => {
            const href = link.getAttribute('href');
            const expectedHref = `/collections?filter=${encodeURIComponent(displayedCollections[i].filterParam)}`;
            expect(href).toBe(expectedHref);
          });
        }
      }),
      { numRuns: 100 }
    );
  });
});
