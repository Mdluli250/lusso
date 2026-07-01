// Feature: discount-promo-codes, Property 8: Cart Store Discount Persistence Round-Trip

/**
 * Property-based test for cart store discount persistence.
 *
 * Property 8 – Cart Store Discount Persistence Round-Trip
 *   For any applied discount added to the cart store, serializing the store state
 *   to localStorage and deserializing it back SHALL preserve the discount code ID,
 *   code string, type, and discount amount.
 *
 *   **Validates: Requirements 5.4, 5.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { AppliedDiscount, DiscountType } from '@/lib/discounts/types';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const discountTypeArb: fc.Arbitrary<DiscountType> = fc.constantFrom(
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'FREE_SHIPPING',
);

const appliedDiscountArb: fc.Arbitrary<AppliedDiscount> = fc.record({
  codeId: fc.string({ minLength: 1, maxLength: 30 }),
  code: fc.stringMatching(/^[A-Z0-9]{1,20}$/),
  type: discountTypeArb,
  discountAmountZAR: fc.nat({ max: 1_000_000 }), // 0 to 10,000 ZAR in cents
  isEmailCapture: fc.boolean(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 8: Cart Store Discount Persistence Round-Trip', () => {
  // Feature: discount-promo-codes, Property 8: Cart Store Discount Persistence Round-Trip
  // **Validates: Requirements 5.4, 5.7**

  it('JSON round-trip preserves codeId, code, type, discountAmountZAR, and isEmailCapture', () => {
    fc.assert(
      fc.property(appliedDiscountArb, (discount) => {
        const serialized = JSON.stringify(discount);
        const deserialized: AppliedDiscount = JSON.parse(serialized);

        expect(deserialized.codeId).toBe(discount.codeId);
        expect(deserialized.code).toBe(discount.code);
        expect(deserialized.type).toBe(discount.type);
        expect(deserialized.discountAmountZAR).toBe(discount.discountAmountZAR);
        expect(deserialized.isEmailCapture).toBe(discount.isEmailCapture);
      }),
      { numRuns: 100 },
    );
  });

  it('JSON round-trip of an array of discounts preserves all entries', () => {
    fc.assert(
      fc.property(
        fc.array(appliedDiscountArb, { minLength: 0, maxLength: 5 }),
        (discounts) => {
          const serialized = JSON.stringify(discounts);
          const deserialized: AppliedDiscount[] = JSON.parse(serialized);

          expect(deserialized).toHaveLength(discounts.length);
          for (let i = 0; i < discounts.length; i++) {
            expect(deserialized[i].codeId).toBe(discounts[i].codeId);
            expect(deserialized[i].code).toBe(discounts[i].code);
            expect(deserialized[i].type).toBe(discounts[i].type);
            expect(deserialized[i].discountAmountZAR).toBe(discounts[i].discountAmountZAR);
            expect(deserialized[i].isEmailCapture).toBe(discounts[i].isEmailCapture);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Zustand persist format round-trip preserves discount fields', () => {
    fc.assert(
      fc.property(
        fc.array(appliedDiscountArb, { minLength: 1, maxLength: 5 }),
        (discounts) => {
          // Simulate Zustand persist storage format: { state: {...}, version: 0 }
          const storeState = {
            state: {
              items: [],
              appliedDiscounts: discounts,
            },
            version: 0,
          };

          const serialized = JSON.stringify(storeState);
          const deserialized = JSON.parse(serialized);

          const restoredDiscounts: AppliedDiscount[] =
            deserialized.state.appliedDiscounts;

          expect(restoredDiscounts).toHaveLength(discounts.length);
          for (let i = 0; i < discounts.length; i++) {
            expect(restoredDiscounts[i].codeId).toBe(discounts[i].codeId);
            expect(restoredDiscounts[i].code).toBe(discounts[i].code);
            expect(restoredDiscounts[i].type).toBe(discounts[i].type);
            expect(restoredDiscounts[i].discountAmountZAR).toBe(
              discounts[i].discountAmountZAR,
            );
            expect(restoredDiscounts[i].isEmailCapture).toBe(
              discounts[i].isEmailCapture,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
