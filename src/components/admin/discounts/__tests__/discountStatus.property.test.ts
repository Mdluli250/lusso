// Feature: discount-promo-codes, Property 12: Code Status Badge Computation
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getDiscountStatus } from '@/lib/discounts/getDiscountStatus';

/**
 * Property 12: Code Status Badge Computation
 *
 * For any DiscountCode, the status badge displays "valid" if and only if:
 * - active is true
 * - startDate is null OR startDate <= now
 * - endDate is null OR endDate >= now
 * - maxUsageCount is null OR usageCount < maxUsageCount
 *
 * Otherwise it displays "invalid".
 *
 * **Validates: Requirements 8.6**
 */

// --- Generators ---

/** Generate a reference "now" date within a reasonable range (with room on both sides) */
const nowArb = fc.integer({
  min: new Date('2022-01-01').getTime(),
  max: new Date('2028-12-31').getTime(),
}).map((ts) => new Date(ts));

/** Generate a nullable date that is <= now (valid startDate) */
function validStartDateArb(now: Date) {
  return fc.oneof(
    fc.constant(null as Date | null),
    fc.date({ min: new Date('2020-01-01'), max: new Date(Math.max(now.getTime(), new Date('2020-01-02').getTime())) })
  );
}

/** Generate a nullable date that is >= now (valid endDate) */
function validEndDateArb(now: Date) {
  return fc.oneof(
    fc.constant(null as Date | null),
    fc.date({ min: new Date(Math.min(now.getTime(), new Date('2030-12-30').getTime())), max: new Date('2030-12-31') })
  );
}

/** Generate a usage scenario where usageCount < maxUsageCount (valid) */
const validUsageArb = fc.oneof(
  // null maxUsageCount means unlimited
  fc.record({
    maxUsageCount: fc.constant(null as number | null),
    usageCount: fc.integer({ min: 0, max: 10000 }),
  }),
  // usageCount < maxUsageCount
  fc.integer({ min: 1, max: 10000 }).chain((max) =>
    fc.record({
      maxUsageCount: fc.constant(max as number | null),
      usageCount: fc.integer({ min: 0, max: max - 1 }),
    })
  )
);

/** Generate a usage scenario where usageCount >= maxUsageCount (invalid) */
const exhaustedUsageArb = fc.integer({ min: 1, max: 10000 }).chain((max) =>
  fc.record({
    maxUsageCount: fc.constant(max as number | null),
    usageCount: fc.integer({ min: max, max: max + 1000 }),
  })
);

describe('Property 12: Code Status Badge Computation', () => {
  describe('12.1 - Returns "valid" when all conditions are met', () => {
    it('returns "valid" when active=true AND startDate<=now AND endDate>=now AND usage<max', () => {
      const now = new Date('2025-06-15T12:00:00Z');
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }), // days before now for startDate
          fc.integer({ min: 1, max: 1000 }), // days after now for endDate
          fc.boolean(), // whether to include startDate
          fc.boolean(), // whether to include endDate
          validUsageArb,
          (daysBefore, daysAfter, includeStart, includeEnd, usage) => {
            const startDate = includeStart
              ? new Date(now.getTime() - daysBefore * 86400000)
              : null;
            const endDate = includeEnd
              ? new Date(now.getTime() + daysAfter * 86400000)
              : null;

            const discount = {
              active: true,
              startDate,
              endDate,
              maxUsageCount: usage.maxUsageCount,
              usageCount: usage.usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('valid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.2 - Returns "invalid" when active=false regardless of other fields', () => {
    it('always returns "invalid" when active is false', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.oneof(fc.constant(null as Date | null), fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
          fc.oneof(fc.constant(null as Date | null), fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
          fc.oneof(fc.constant(null as number | null), fc.integer({ min: 1, max: 10000 })),
          fc.integer({ min: 0, max: 10000 }),
          (now, startDate, endDate, maxUsageCount, usageCount) => {
            const discount = {
              active: false,
              startDate,
              endDate,
              maxUsageCount,
              usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('invalid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.3 - Returns "invalid" when startDate > now', () => {
    it('returns "invalid" when startDate is in the future', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.integer({ min: 60_000, max: 365 * 24 * 60 * 60 * 1000 }), // offset in ms (1 min to 1 year)
          validUsageArb,
          (now, offsetMs, usage) => {
            const startDate = new Date(now.getTime() + offsetMs);
            const discount = {
              active: true,
              startDate,
              endDate: null as Date | null,
              maxUsageCount: usage.maxUsageCount,
              usageCount: usage.usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('invalid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.4 - Returns "invalid" when endDate < now', () => {
    it('returns "invalid" when endDate is in the past', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.integer({ min: 60_000, max: 365 * 24 * 60 * 60 * 1000 }), // offset in ms (1 min to 1 year)
          validUsageArb,
          (now, offsetMs, usage) => {
            const endDate = new Date(now.getTime() - offsetMs);
            const discount = {
              active: true,
              startDate: null as Date | null,
              endDate,
              maxUsageCount: usage.maxUsageCount,
              usageCount: usage.usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('invalid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.5 - Returns "invalid" when usageCount >= maxUsageCount', () => {
    it('returns "invalid" when usage is exhausted', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }), // startDate offset (0 = null)
          fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }), // endDate offset (0 = null)
          exhaustedUsageArb,
          (now, startOffset, endOffset, usage) => {
            // Create valid start/end dates (or null if offset is 0)
            const startDate = startOffset > 0 ? new Date(now.getTime() - startOffset) : null;
            const endDate = endOffset > 0 ? new Date(now.getTime() + endOffset) : null;

            const discount = {
              active: true,
              startDate,
              endDate,
              maxUsageCount: usage.maxUsageCount,
              usageCount: usage.usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('invalid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.6 - With null dates and null maxUsageCount, only active flag matters', () => {
    it('returns "valid" when active=true and all nullable fields are null', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.integer({ min: 0, max: 100000 }),
          (now, usageCount) => {
            const discount = {
              active: true,
              startDate: null,
              endDate: null,
              maxUsageCount: null,
              usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('valid');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns "invalid" when active=false and all nullable fields are null', () => {
      fc.assert(
        fc.property(
          nowArb,
          fc.integer({ min: 0, max: 100000 }),
          (now, usageCount) => {
            const discount = {
              active: false,
              startDate: null,
              endDate: null,
              maxUsageCount: null,
              usageCount,
            };

            const result = getDiscountStatus(discount, now);
            expect(result).toBe('invalid');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('12.7 - Formula verification: valid iff active AND dates valid AND usage valid', () => {
    it('getDiscountStatus matches the expected formula for arbitrary inputs', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          nowArb,
          fc.oneof(fc.constant(null as Date | null), fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
          fc.oneof(fc.constant(null as Date | null), fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })),
          fc.oneof(fc.constant(null as number | null), fc.integer({ min: 1, max: 10000 })),
          fc.integer({ min: 0, max: 20000 }),
          (active, now, startDate, endDate, maxUsageCount, usageCount) => {
            // Filter out NaN dates which can't occur in practice
            fc.pre(!now || !isNaN(now.getTime()));
            fc.pre(!startDate || !isNaN(startDate.getTime()));
            fc.pre(!endDate || !isNaN(endDate.getTime()));

            const discount = {
              active,
              startDate,
              endDate,
              maxUsageCount,
              usageCount,
            };

            const result = getDiscountStatus(discount, now);

            // Compute expected using the formula
            const startDateValid = startDate === null || startDate <= now;
            const endDateValid = endDate === null || endDate >= now;
            const usageValid = maxUsageCount === null || usageCount < maxUsageCount;
            const expectedValid = active && startDateValid && endDateValid && usageValid;

            const expected = expectedValid ? 'valid' : 'invalid';
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
