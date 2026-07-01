import { describe, it, expect } from 'vitest';
import { validateStackingRules } from '../validate';
import type { DiscountCodeData, AppliedDiscount } from '../types';

const baseCode: DiscountCodeData = {
  id: 'code-1',
  code: 'STACK10',
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
};

const existingDiscount: AppliedDiscount = {
  codeId: 'existing-1',
  code: 'EXIST10',
  type: 'PERCENTAGE',
  discountAmountZAR: 2000,
  isEmailCapture: false,
};

describe('validateStackingRules', () => {
  describe('when no existing discounts are applied', () => {
    it('allows a stackable code', () => {
      const result = validateStackingRules(baseCode, [], false);
      expect(result).toEqual({ valid: true });
    });

    it('allows a non-stackable code', () => {
      const nonStackable = { ...baseCode, stackable: false };
      const result = validateStackingRules(nonStackable, [], false);
      expect(result).toEqual({ valid: true });
    });
  });

  describe('when a non-stackable code is already applied (hasNonStackableExisting = true)', () => {
    it('rejects a new stackable code with appropriate message', () => {
      const result = validateStackingRules(
        baseCode,
        [existingDiscount],
        true
      );
      expect(result).toEqual({
        valid: false,
        error: 'Cannot add more codes when a non-stackable discount is applied.',
      });
    });

    it('rejects a new non-stackable code with appropriate message', () => {
      const nonStackable = { ...baseCode, stackable: false };
      const result = validateStackingRules(
        nonStackable,
        [existingDiscount],
        true
      );
      expect(result).toEqual({
        valid: false,
        error: 'This code cannot be combined with other discounts. Remove the existing code first.',
      });
    });
  });

  describe('when only stackable codes are applied (hasNonStackableExisting = false)', () => {
    it('allows a new stackable code', () => {
      const result = validateStackingRules(
        baseCode,
        [existingDiscount],
        false
      );
      expect(result).toEqual({ valid: true });
    });

    it('rejects a new non-stackable code when other codes exist', () => {
      const nonStackable = { ...baseCode, stackable: false };
      const result = validateStackingRules(
        nonStackable,
        [existingDiscount],
        false
      );
      expect(result).toEqual({
        valid: false,
        error: 'This code cannot be combined with other discounts. Remove the existing code first.',
      });
    });
  });

  describe('requirement 4.1 — max one non-stackable code per order', () => {
    it('rejects non-stackable code when another non-stackable is applied', () => {
      const nonStackable = { ...baseCode, stackable: false };
      const result = validateStackingRules(
        nonStackable,
        [existingDiscount],
        true
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('requirement 4.3 — stackable codes combine with other stackable codes', () => {
    it('allows multiple stackable codes', () => {
      const existingStackableDiscounts: AppliedDiscount[] = [
        { codeId: 'a', code: 'A10', type: 'PERCENTAGE', discountAmountZAR: 1000, isEmailCapture: false },
        { codeId: 'b', code: 'B20', type: 'FIXED_AMOUNT', discountAmountZAR: 2000, isEmailCapture: false },
      ];
      const result = validateStackingRules(
        baseCode,
        existingStackableDiscounts,
        false
      );
      expect(result).toEqual({ valid: true });
    });
  });
});
