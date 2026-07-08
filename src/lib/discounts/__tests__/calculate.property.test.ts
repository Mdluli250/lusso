// Feature: discount-promo-codes, Property 7: Multiple Discount Summation with Cap

/**
 * Property-based test for multiple discount summation with cap.
 *
 * Property 7 – Multiple Discount Summation with Cap
 *   For any set of stackable discount codes applied to a cart, the total discount
 *   SHALL equal the minimum of (the sum of individual discounts each calculated on
 *   the original subtotal) and the cart subtotal. The resulting order total SHALL
 *   never be negative.
 *
 *   **Validates: Requirements 4.5, 4.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateTotalDiscount } from '../calculate';
import type { AppliedDiscount, DiscountType } from '../types';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const discountTypeArb: fc.Arbitrary<DiscountType> = fc.constantFrom(
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'FREE_SHIPPING',
);

const appliedDiscountArb: fc.Arbitrary<AppliedDiscount> = fc.record({
  codeId: fc.string({ minLength: 1, maxLength: 10 }),
  code: fc.string({ minLength: 1, maxLength: 8 }),
  type: discountTypeArb,
  discountAmountZAR: fc.nat({ max: 1_000_000 }), // 0 to 10,000 ZAR in cents
  isEmailCapture: fc.boolean(),
});

const discountsArrayArb = fc.array(appliedDiscountArb, { minLength: 0, maxLength: 10 });

const cartSubtotalArb = fc.nat({ max: 5_000_000 }); // 0 to 50,000 ZAR in cents

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 7: Multiple Discount Summation with Cap', () => {
  // Feature: discount-promo-codes, Property 7: Multiple Discount Summation with Cap
  // **Validates: Requirements 4.5, 4.6**

  it('total discount is always <= cart subtotal (capping property)', () => {
    fc.assert(
      fc.property(discountsArrayArb, cartSubtotalArb, (discounts, cartSubtotal) => {
        const totalDiscount = calculateTotalDiscount(discounts, cartSubtotal);
        expect(totalDiscount).toBeLessThanOrEqual(cartSubtotal);
      }),
      { numRuns: 100 },
    );
  });

  it('total discount equals sum of individual discounts when sum <= cartSubtotal', () => {
    fc.assert(
      fc.property(discountsArrayArb, cartSubtotalArb, (discounts, cartSubtotal) => {
        const sum = discounts.reduce((acc, d) => acc + d.discountAmountZAR, 0);
        const totalDiscount = calculateTotalDiscount(discounts, cartSubtotal);

        if (sum <= cartSubtotal) {
          expect(totalDiscount).toBe(sum);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('total discount equals cartSubtotal when sum of individual discounts > cartSubtotal', () => {
    fc.assert(
      fc.property(discountsArrayArb, cartSubtotalArb, (discounts, cartSubtotal) => {
        const sum = discounts.reduce((acc, d) => acc + d.discountAmountZAR, 0);
        const totalDiscount = calculateTotalDiscount(discounts, cartSubtotal);

        if (sum > cartSubtotal) {
          expect(totalDiscount).toBe(cartSubtotal);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('order total (cartSubtotal - totalDiscount) is never negative', () => {
    fc.assert(
      fc.property(discountsArrayArb, cartSubtotalArb, (discounts, cartSubtotal) => {
        const totalDiscount = calculateTotalDiscount(discounts, cartSubtotal);
        const orderTotal = cartSubtotal - totalDiscount;
        expect(orderTotal).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 },
    );
  });
});
