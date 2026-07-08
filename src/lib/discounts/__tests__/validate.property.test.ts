// Feature: discount-promo-codes, Property 4: Validation Pipeline Correctness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDiscountConditions } from '../validate';
import type { DiscountCodeData, CartItemForDiscount } from '../types';

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
 *
 * Property 4: Validation Pipeline Correctness
 * For any discount code, cart, user, and current time combination, the validation
 * function returns success iff ALL conditions hold. When any condition fails,
 * the specific error message corresponding to the first failing condition is returned.
 */

// --- Generators ---

/** Generate a valid cart item */
const cartItemArb = fc.record({
  productId: fc.uuid(),
  price: fc.integer({ min: 100, max: 100000 }), // 1 ZAR to 1000 ZAR in cents
  quantity: fc.integer({ min: 1, max: 10 }),
});

/** Generate a non-empty cart */
const cartArb = fc.array(cartItemArb, { minLength: 1, maxLength: 5 });

/**
 * Generate a fully valid DiscountCodeData + matching context (cart, subtotal, usage, time)
 * so that ALL conditions pass. Then individual tests selectively invalidate one condition.
 */
function validScenarioArb() {
  return cartArb.chain((cartItems) => {
    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return fc
      .record({
        id: fc.uuid(),
        code: fc.stringMatching(/^[A-Z0-9]{4,12}$/),
        type: fc.constantFrom(
          'PERCENTAGE' as const,
          'FIXED_AMOUNT' as const,
          'FREE_SHIPPING' as const
        ),
        value: fc.integer({ min: 1, max: 100 }),
        // minOrderAmountZAR <= cartSubtotal so it passes
        minOrderAmountZAR: fc.integer({ min: 0, max: cartSubtotal }),
        maxUsageCount: fc.oneof(
          fc.constant(null as null),
          fc.integer({ min: 2, max: 1000 })
        ),
        perUserLimit: fc.oneof(
          fc.constant(null as null),
          fc.integer({ min: 2, max: 100 })
        ),
        maxDiscountAmountZAR: fc.oneof(
          fc.constant(null as null),
          fc.integer({ min: 100, max: 50000 })
        ),
        stackable: fc.boolean(),
        // startDate in the past, endDate in the future
        startDateOffset: fc.integer({ min: 1, max: 365 }), // days in past
        endDateOffset: fc.integer({ min: 1, max: 365 }), // days in future
        active: fc.constant(true),
        useProductRestrictions: fc.boolean(),
        currentUsageCount: fc.integer({ min: 0, max: 1 }),
        userUsageCount: fc.integer({ min: 0, max: 1 }),
      })
      .map((params) => {
        const now = new Date('2025-06-15T12:00:00Z');
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - params.startDateOffset);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + params.endDateOffset);

        // Ensure currentUsageCount < maxUsageCount
        const currentUsageCount =
          params.maxUsageCount !== null
            ? Math.min(params.currentUsageCount, params.maxUsageCount - 1)
            : params.currentUsageCount;

        // Ensure userUsageCount < perUserLimit
        const userUsageCount =
          params.perUserLimit !== null
            ? Math.min(params.userUsageCount, params.perUserLimit - 1)
            : params.userUsageCount;

        // Product restrictions: use actual cart product IDs so they always match
        const applicableProductIds = params.useProductRestrictions
          ? [cartItems[0].productId]
          : [];

        const code: DiscountCodeData = {
          id: params.id,
          code: params.code,
          type: params.type,
          value: params.type === 'FREE_SHIPPING' ? 0 : params.value,
          minOrderAmountZAR: params.minOrderAmountZAR,
          maxUsageCount: params.maxUsageCount,
          perUserLimit: params.perUserLimit,
          maxDiscountAmountZAR: params.maxDiscountAmountZAR,
          stackable: params.stackable,
          startDate,
          endDate,
          active: true,
          applicableProductIds,
        };

        return {
          code,
          cartItems,
          cartSubtotal,
          currentUsageCount,
          userUsageCount,
          now,
        };
      });
  });
}

describe('Property 4: Validation Pipeline Correctness', () => {
  describe('4.1 - All conditions met → valid: true with discount', () => {
    it(
      'returns valid: true when ALL conditions pass',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            const result = validateDiscountConditions(
              scenario.code,
              scenario.cartItems,
              scenario.cartSubtotal,
              scenario.currentUsageCount,
              scenario.userUsageCount,
              scenario.now
            );

            expect(result.valid).toBe(true);
            if (result.valid) {
              expect(result.discount).toBeDefined();
              expect(result.discount.codeId).toBe(scenario.code.id);
              expect(result.discount.code).toBe(scenario.code.code);
              expect(result.discount.type).toBe(scenario.code.type);
              expect(result.discount.discountAmountZAR).toBeGreaterThanOrEqual(0);
            }
          }),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.2 - Inactive code → "This code is no longer active."', () => {
    it(
      'returns correct error when code is inactive',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            const inactiveCode = { ...scenario.code, active: false };

            const result = validateDiscountConditions(
              inactiveCode,
              scenario.cartItems,
              scenario.cartSubtotal,
              scenario.currentUsageCount,
              scenario.userUsageCount,
              scenario.now
            );

            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toBe('This code is no longer active.');
            }
          }),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.3 - Before start date → "This code is not yet valid."', () => {
    it(
      'returns correct error when current time is before start date',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 365 }),
            (scenario, daysInFuture) => {
              // Set startDate to the future so now < startDate
              const futureStart = new Date(scenario.now);
              futureStart.setDate(futureStart.getDate() + daysInFuture);
              const codeWithFutureStart = {
                ...scenario.code,
                startDate: futureStart,
              };

              const result = validateDiscountConditions(
                codeWithFutureStart,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe('This code is not yet valid.');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.4 - After end date → "This code has expired."', () => {
    it(
      'returns correct error when current time is after end date',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 365 }),
            (scenario, daysInPast) => {
              // Set endDate to the past so now > endDate
              const pastEnd = new Date(scenario.now);
              pastEnd.setDate(pastEnd.getDate() - daysInPast);
              // Ensure startDate is still before endDate for a realistic scenario
              const pastStart = new Date(pastEnd);
              pastStart.setDate(pastStart.getDate() - 10);
              const codeWithPastEnd = {
                ...scenario.code,
                startDate: pastStart,
                endDate: pastEnd,
              };

              const result = validateDiscountConditions(
                codeWithPastEnd,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe('This code has expired.');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.5 - Global usage >= maxUsageCount → "This code has reached its usage limit."', () => {
    it(
      'returns correct error when global usage is at or above the limit',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 1000 }),
            fc.integer({ min: 0, max: 500 }),
            (scenario, maxUsage, extra) => {
              const codeWithLimit = {
                ...scenario.code,
                maxUsageCount: maxUsage,
              };
              // Set currentUsageCount to be >= maxUsageCount
              const currentUsageCount = maxUsage + extra;

              const result = validateDiscountConditions(
                codeWithLimit,
                scenario.cartItems,
                scenario.cartSubtotal,
                currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe(
                  'This code has reached its usage limit.'
                );
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.6 - User usage >= perUserLimit → "You have already used this code."', () => {
    it(
      'returns correct error when user usage is at or above the per-user limit',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 0, max: 50 }),
            (scenario, perUserLimit, extra) => {
              const codeWithUserLimit = {
                ...scenario.code,
                perUserLimit,
              };
              const userUsageCount = perUserLimit + extra;

              const result = validateDiscountConditions(
                codeWithUserLimit,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe('You have already used this code.');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.7 - Cart subtotal < minOrderAmountZAR → error contains "Minimum order of R"', () => {
    it(
      'returns correct error when cart subtotal is below minimum order amount',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 100000 }),
            (scenario, extraCents) => {
              // Set minOrderAmountZAR well above the cartSubtotal
              const minOrder = scenario.cartSubtotal + extraCents;
              const codeWithMinOrder = {
                ...scenario.code,
                minOrderAmountZAR: minOrder,
              };

              const result = validateDiscountConditions(
                codeWithMinOrder,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toContain('Minimum order of R');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.8 - Product restrictions with no matching items → "This code does not apply to items in your cart."', () => {
    it(
      'returns correct error when product restrictions exist and no cart items match',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }),
            (scenario, nonMatchingIds) => {
              // Use product IDs that don't exist in the cart
              const cartProductIds = scenario.cartItems.map(
                (item) => item.productId
              );
              const restrictedIds = nonMatchingIds.filter(
                (id) => !cartProductIds.includes(id)
              );

              // If all generated IDs happen to match cart items, use a guaranteed non-matching one
              const safeRestrictedIds =
                restrictedIds.length > 0
                  ? restrictedIds
                  : ['non-existent-product-id-xyz'];

              const codeWithRestrictions = {
                ...scenario.code,
                applicableProductIds: safeRestrictedIds,
              };

              const result = validateDiscountConditions(
                codeWithRestrictions,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe(
                  'This code does not apply to items in your cart.'
                );
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });

  describe('4.9 - Priority ordering: first failing check error is returned', () => {
    it(
      'inactive takes priority over expired (inactive checked before endDate)',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            // Make both inactive AND expired
            const pastEnd = new Date(scenario.now);
            pastEnd.setDate(pastEnd.getDate() - 5);
            const pastStart = new Date(pastEnd);
            pastStart.setDate(pastStart.getDate() - 10);

            const codeWithMultipleFailures = {
              ...scenario.code,
              active: false,
              startDate: pastStart,
              endDate: pastEnd,
            };

            const result = validateDiscountConditions(
              codeWithMultipleFailures,
              scenario.cartItems,
              scenario.cartSubtotal,
              scenario.currentUsageCount,
              scenario.userUsageCount,
              scenario.now
            );

            expect(result.valid).toBe(false);
            if (!result.valid) {
              // Inactive is checked first, so its error takes priority
              expect(result.error).toBe('This code is no longer active.');
            }
          }),
          { numRuns: 100 }
        );
      }
    );

    it(
      'start date takes priority over end date (startDate checked before endDate)',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 100 }),
            (scenario, daysInFuture) => {
              // Make both not yet started AND would also be expired (impossible in real life,
              // but validates priority: startDate in future, endDate in past)
              const futureStart = new Date(scenario.now);
              futureStart.setDate(futureStart.getDate() + daysInFuture);
              const pastEnd = new Date(scenario.now);
              pastEnd.setDate(pastEnd.getDate() - 1);

              const codeWithMultipleFailures = {
                ...scenario.code,
                startDate: futureStart,
                endDate: pastEnd,
              };

              const result = validateDiscountConditions(
                codeWithMultipleFailures,
                scenario.cartItems,
                scenario.cartSubtotal,
                scenario.currentUsageCount,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                // Start date is checked before end date
                expect(result.error).toBe('This code is not yet valid.');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );

    it(
      'expired takes priority over usage limit (endDate checked before maxUsageCount)',
      () => {
        fc.assert(
          fc.property(
            validScenarioArb(),
            fc.integer({ min: 1, max: 365 }),
            (scenario, daysInPast) => {
              const pastEnd = new Date(scenario.now);
              pastEnd.setDate(pastEnd.getDate() - daysInPast);
              const pastStart = new Date(pastEnd);
              pastStart.setDate(pastStart.getDate() - 10);

              const codeWithMultipleFailures = {
                ...scenario.code,
                startDate: pastStart,
                endDate: pastEnd,
                maxUsageCount: 1,
              };

              const result = validateDiscountConditions(
                codeWithMultipleFailures,
                scenario.cartItems,
                scenario.cartSubtotal,
                // Also exceed usage limit
                100,
                scenario.userUsageCount,
                scenario.now
              );

              expect(result.valid).toBe(false);
              if (!result.valid) {
                expect(result.error).toBe('This code has expired.');
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );

    it(
      'usage limit takes priority over per-user limit',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            const codeWithBothLimits = {
              ...scenario.code,
              maxUsageCount: 5,
              perUserLimit: 2,
            };

            const result = validateDiscountConditions(
              codeWithBothLimits,
              scenario.cartItems,
              scenario.cartSubtotal,
              // Exceed global limit
              10,
              // Also exceed user limit
              5,
              scenario.now
            );

            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toBe(
                'This code has reached its usage limit.'
              );
            }
          }),
          { numRuns: 100 }
        );
      }
    );

    it(
      'per-user limit takes priority over minimum order',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            const codeWithBothFailures = {
              ...scenario.code,
              perUserLimit: 1,
              minOrderAmountZAR: scenario.cartSubtotal + 10000,
            };

            const result = validateDiscountConditions(
              codeWithBothFailures,
              scenario.cartItems,
              scenario.cartSubtotal,
              scenario.currentUsageCount,
              // Exceed per-user limit
              5,
              scenario.now
            );

            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toBe('You have already used this code.');
            }
          }),
          { numRuns: 100 }
        );
      }
    );

    it(
      'minimum order takes priority over product restrictions',
      () => {
        fc.assert(
          fc.property(validScenarioArb(), (scenario) => {
            const codeWithBothFailures = {
              ...scenario.code,
              minOrderAmountZAR: scenario.cartSubtotal + 10000,
              applicableProductIds: ['non-existent-product-xyz'],
            };

            const result = validateDiscountConditions(
              codeWithBothFailures,
              scenario.cartItems,
              scenario.cartSubtotal,
              scenario.currentUsageCount,
              scenario.userUsageCount,
              scenario.now
            );

            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toContain('Minimum order of R');
            }
          }),
          { numRuns: 100 }
        );
      }
    );
  });
});


// Feature: discount-promo-codes, Property 3: Validation Input Constraints
import { calculateDiscount, calculateApplicableSubtotal } from '../calculate';

/**
 * Property 3: Validation Input Constraints
 *
 * Tests that:
 * - Percentage values in [1, 100] produce correct discount calculations
 * - Fixed amounts that are positive produce correct results
 * - When startDate < endDate and now is between them, validation succeeds
 * - When startDate > endDate (invalid state), the behavior is consistent
 *
 * **Validates: Requirements 1.5, 1.6, 9.6**
 */

// Helper: build a valid base discount code data object for Property 3
function makeBaseCodeP3(overrides: Partial<DiscountCodeData> = {}): DiscountCodeData {
  return {
    id: 'test-code-id',
    code: 'TESTCODE',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmountZAR: 0,
    maxUsageCount: null,
    perUserLimit: null,
    maxDiscountAmountZAR: null,
    stackable: true,
    startDate: null,
    endDate: null,
    active: true,
    applicableProductIds: [],
    ...overrides,
  };
}

// Helper: generate a non-empty cart with a known subtotal
function makeCartItemsP3(subtotalCents: number): CartItemForDiscount[] {
  return [{ productId: 'prod-1', price: subtotalCents, quantity: 1 }];
}

describe('Property 3: Validation Input Constraints', () => {
  // **Validates: Requirements 1.5, 1.6, 9.6**

  describe('Percentage values in [1, 100] produce correct discount calculations', () => {
    it('percentage in [1, 100] yields discount = min(round(subtotal * value / 100), subtotal)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 100, max: 1_000_000 }),
          (percentage, subtotalCents) => {
            const code = makeBaseCodeP3({ type: 'PERCENTAGE', value: percentage });
            const cartItems = makeCartItemsP3(subtotalCents);

            const result = validateDiscountConditions(
              code,
              cartItems,
              subtotalCents,
              0,
              0,
              new Date()
            );

            expect(result.valid).toBe(true);
            if (result.valid) {
              const expectedRaw = Math.round(subtotalCents * percentage / 100);
              const expected = Math.min(expectedRaw, subtotalCents);
              expect(result.discount.discountAmountZAR).toBe(expected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('percentage in [1, 100] with maxDiscountAmountZAR caps correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 100, max: 1_000_000 }),
          fc.integer({ min: 1, max: 500_000 }),
          (percentage, subtotalCents, maxCap) => {
            const code = makeBaseCodeP3({
              type: 'PERCENTAGE',
              value: percentage,
              maxDiscountAmountZAR: maxCap,
            });
            const cartItems = makeCartItemsP3(subtotalCents);

            const result = validateDiscountConditions(
              code,
              cartItems,
              subtotalCents,
              0,
              0,
              new Date()
            );

            expect(result.valid).toBe(true);
            if (result.valid) {
              const raw = Math.round(subtotalCents * percentage / 100);
              const capped = Math.min(raw, maxCap);
              const expected = Math.min(capped, subtotalCents);
              expect(result.discount.discountAmountZAR).toBe(expected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Fixed amounts that are positive produce correct results', () => {
    it('positive fixed amount produces discount = min(value, applicableSubtotal)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }),
          fc.integer({ min: 1, max: 1_000_000 }),
          (fixedAmount, subtotalCents) => {
            const code = makeBaseCodeP3({ type: 'FIXED_AMOUNT', value: fixedAmount });
            const cartItems = makeCartItemsP3(subtotalCents);

            const result = validateDiscountConditions(
              code,
              cartItems,
              subtotalCents,
              0,
              0,
              new Date()
            );

            expect(result.valid).toBe(true);
            if (result.valid) {
              const expected = Math.min(fixedAmount, subtotalCents);
              expect(result.discount.discountAmountZAR).toBe(expected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('fixed amount discount never exceeds the applicable subtotal', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10_000_000 }),
          fc.integer({ min: 1, max: 1_000_000 }),
          (fixedAmount, subtotalCents) => {
            const code = makeBaseCodeP3({ type: 'FIXED_AMOUNT', value: fixedAmount });
            const cartItems = makeCartItemsP3(subtotalCents);

            const result = validateDiscountConditions(
              code,
              cartItems,
              subtotalCents,
              0,
              0,
              new Date()
            );

            expect(result.valid).toBe(true);
            if (result.valid) {
              expect(result.discount.discountAmountZAR).toBeLessThanOrEqual(subtotalCents);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Temporal constraints: startDate before endDate', () => {
    it('when startDate < endDate and now is between them, validation succeeds', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          fc.integer({ min: 1, max: 365 * 5 }),
          fc.nat({ max: 100 }),
          (startDate, daySpan, nowOffset) => {
            const endDate = new Date(startDate.getTime() + daySpan * 24 * 60 * 60 * 1000);
            // now is between startDate and endDate
            const fraction = nowOffset / 100;
            const now = new Date(
              startDate.getTime() + fraction * (endDate.getTime() - startDate.getTime())
            );

            const code = makeBaseCodeP3({
              type: 'PERCENTAGE',
              value: 10,
              startDate,
              endDate,
            });
            const cartItems = makeCartItemsP3(10000);

            const result = validateDiscountConditions(
              code,
              cartItems,
              10000,
              0,
              0,
              now
            );

            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('when startDate > endDate (invalid state) and now is between endDate and startDate, reports not yet valid', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
          fc.integer({ min: 1, max: 365 * 2 }),
          (endDate, daySpan) => {
            // Guard against NaN dates
            fc.pre(!isNaN(endDate.getTime()));

            // startDate is AFTER endDate (invalid state that leaked through)
            const startDate = new Date(endDate.getTime() + daySpan * 24 * 60 * 60 * 1000);
            // now is after endDate but before startDate
            const now = new Date(endDate.getTime() + Math.floor(daySpan * 24 * 60 * 60 * 1000 / 2));

            // Verify our setup: endDate < now < startDate
            fc.pre(now > endDate && now < startDate);

            const code = makeBaseCodeP3({
              type: 'PERCENTAGE',
              value: 10,
              startDate,
              endDate,
            });
            const cartItems = makeCartItemsP3(10000);

            const result = validateDiscountConditions(
              code,
              cartItems,
              10000,
              0,
              0,
              now
            );

            // Validation checks startDate before endDate.
            // Since now < startDate, it returns "not yet valid" before reaching endDate check.
            // This is the consistent behavior when invalid startDate > endDate leaks through.
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toBe('This code is not yet valid.');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('when startDate > endDate (invalid state) and now < both dates, reports not yet valid', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2026-01-01'), max: new Date('2030-01-01') }),
          fc.integer({ min: 1, max: 365 * 5 }),
          (startDate, daySpan) => {
            // Guard against NaN dates
            fc.pre(!isNaN(startDate.getTime()));

            // endDate is BEFORE startDate (invalid state)
            const endDate = new Date(startDate.getTime() - daySpan * 24 * 60 * 60 * 1000);
            // now is before both dates
            const now = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

            const code = makeBaseCodeP3({
              type: 'PERCENTAGE',
              value: 10,
              startDate,
              endDate,
            });
            const cartItems = makeCartItemsP3(10000);

            const result = validateDiscountConditions(
              code,
              cartItems,
              10000,
              0,
              0,
              now
            );

            // The validation checks start date first: now < startDate → "not yet valid"
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.error).toBe('This code is not yet valid.');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


// Feature: discount-promo-codes, Property 10: Email Capture Code Fallback

/**
 * Property 10: Email Capture Code Fallback
 *
 * Tests that codes in EmailCapture but not DiscountCode table are treated as
 * 10% PERCENTAGE, no minimum, no expiration, not stackable, max 1 total redemption.
 *
 * We test this at the PURE validation layer by verifying the behavior of the
 * virtual DiscountCodeData that the service creates for email capture codes.
 *
 * **Validates: Requirements 7.1**
 */
describe('Property 10: Email Capture Code Fallback', () => {
  /**
   * Helper: creates the virtual DiscountCodeData that the service layer
   * constructs for email capture codes (mirrors service.ts logic exactly).
   */
  function makeEmailCaptureVirtualCode(code: string): DiscountCodeData {
    return {
      id: `emailcapture:${code}`,
      code,
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmountZAR: 0,
      maxUsageCount: 1,
      perUserLimit: null,
      maxDiscountAmountZAR: null,
      stackable: false,
      startDate: null,
      endDate: null,
      active: true,
      applicableProductIds: [],
    };
  }

  it('always produces a valid result when usageCount=0 and cart subtotal > 0', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.array(
          fc.record({
            productId: fc.uuid(),
            price: fc.integer({ min: 100, max: 500000 }),
            quantity: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (codeStr, cartItems) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartSubtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            cartSubtotal,
            0, // usageCount = 0
            0, // userUsageCount
            new Date()
          );

          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('produces a 10% discount: Math.round(subtotal * 10 / 100)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.integer({ min: 100, max: 1_000_000 }),
        (codeStr, subtotalCents) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartItems: CartItemForDiscount[] = [
            { productId: 'prod-1', price: subtotalCents, quantity: 1 },
          ];

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            subtotalCents,
            0,
            0,
            new Date()
          );

          expect(result.valid).toBe(true);
          if (result.valid) {
            const expected = Math.round(subtotalCents * 10 / 100);
            expect(result.discount.discountAmountZAR).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('has no minimum order: succeeds with any positive subtotal', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.integer({ min: 1, max: 100 }), // very small subtotals (1 cent to 1 ZAR)
        (codeStr, subtotalCents) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartItems: CartItemForDiscount[] = [
            { productId: 'prod-1', price: subtotalCents, quantity: 1 },
          ];

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            subtotalCents,
            0,
            0,
            new Date()
          );

          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('has no expiration: succeeds regardless of date', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
        (codeStr, now) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartItems: CartItemForDiscount[] = [
            { productId: 'prod-1', price: 10000, quantity: 1 },
          ];

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            10000,
            0,
            0,
            now
          );

          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('applies to all products: empty applicableProductIds means any product matches', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.array(
          fc.record({
            productId: fc.uuid(),
            price: fc.integer({ min: 100, max: 100000 }),
            quantity: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (codeStr, cartItems) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartSubtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            cartSubtotal,
            0,
            0,
            new Date()
          );

          // With empty applicableProductIds, validation should always succeed
          // regardless of what productIds are in the cart
          expect(result.valid).toBe(true);
          if (result.valid) {
            // Discount is calculated on all items (full subtotal)
            const expectedDiscount = Math.round(cartSubtotal * 10 / 100);
            expect(result.discount.discountAmountZAR).toBe(expectedDiscount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects when currentUsageCount >= 1 (single-use enforcement)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{6,12}$/),
        fc.integer({ min: 1, max: 100 }), // usageCount >= 1
        (codeStr, usageCount) => {
          const virtualCode = makeEmailCaptureVirtualCode(codeStr);
          const cartItems: CartItemForDiscount[] = [
            { productId: 'prod-1', price: 10000, quantity: 1 },
          ];

          const result = validateDiscountConditions(
            virtualCode,
            cartItems,
            10000,
            usageCount, // >= 1, should be rejected since maxUsageCount=1
            0,
            new Date()
          );

          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error).toBe('This code has reached its usage limit.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// Feature: discount-promo-codes, Property 11: Email Capture Single-Use Enforcement

/**
 * Property 11: Email Capture Single-Use Enforcement
 *
 * For any email capture code that has been redeemed once (currentUsageCount >= 1),
 * subsequent validation attempts are rejected regardless of which user attempts
 * to redeem it. The per-code limit is global (maxUsageCount=1), not per-user.
 *
 * **Validates: Requirements 7.3**
 */
describe('Property 11: Email Capture Single-Use Enforcement', () => {
  /** Virtual email capture code shape as created by the service */
  const emailCaptureCode: DiscountCodeData = {
    id: 'emailcapture:TESTCODE',
    code: 'TESTCODE',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmountZAR: 0,
    maxUsageCount: 1,
    perUserLimit: null,
    maxDiscountAmountZAR: null,
    stackable: false,
    startDate: null,
    endDate: null,
    active: true,
    applicableProductIds: [],
  };

  /** Generate a non-empty cart with arbitrary items */
  const cartItemArb11 = fc.record({
    productId: fc.uuid(),
    price: fc.integer({ min: 100, max: 500000 }),
    quantity: fc.integer({ min: 1, max: 10 }),
  });

  const cartArb11 = fc.array(cartItemArb11, { minLength: 1, maxLength: 5 });

  it('rejects email capture code when currentUsageCount >= 1 regardless of cart or user', () => {
    fc.assert(
      fc.property(
        cartArb11,
        fc.integer({ min: 1, max: 1000 }), // currentUsageCount >= 1 (already redeemed)
        fc.integer({ min: 0, max: 100 }),   // arbitrary userUsageCount
        (cartItems, currentUsageCount, userUsageCount) => {
          const cartSubtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const result = validateDiscountConditions(
            emailCaptureCode,
            cartItems,
            cartSubtotal,
            currentUsageCount,
            userUsageCount,
            new Date()
          );

          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error).toBe('This code has reached its usage limit.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejection is global (not per-user) — different users all get rejected after first redemption', () => {
    fc.assert(
      fc.property(
        cartArb11,
        fc.integer({ min: 1, max: 500 }),  // currentUsageCount >= 1
        fc.integer({ min: 0, max: 0 }),    // userUsageCount = 0 (a brand new user)
        (cartItems, currentUsageCount, userUsageCount) => {
          const cartSubtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Even when the specific user has never used this code (userUsageCount=0),
          // the global limit (maxUsageCount=1) blocks them
          const result = validateDiscountConditions(
            emailCaptureCode,
            cartItems,
            cartSubtotal,
            currentUsageCount,
            userUsageCount,
            new Date()
          );

          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error).toBe('This code has reached its usage limit.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts email capture code when currentUsageCount is 0 (first redemption)', () => {
    fc.assert(
      fc.property(
        cartArb11,
        (cartItems) => {
          const cartSubtotal = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          const result = validateDiscountConditions(
            emailCaptureCode,
            cartItems,
            cartSubtotal,
            0, // not yet redeemed
            0, // user hasn't used it
            new Date()
          );

          // Should be valid since no usage yet
          expect(result.valid).toBe(true);
          if (result.valid) {
            expect(result.discount.codeId).toBe('emailcapture:TESTCODE');
            expect(result.discount.type).toBe('PERCENTAGE');
            expect(result.discount.discountAmountZAR).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
