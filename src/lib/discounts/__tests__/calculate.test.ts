import { describe, it, expect } from 'vitest';
import {
  calculateApplicableSubtotal,
  calculateDiscount,
  calculateTotalDiscount,
  generatePromoCode,
} from '../calculate';
import type { CartItemForDiscount, DiscountCodeData, AppliedDiscount } from '../types';

describe('calculateApplicableSubtotal', () => {
  const items: CartItemForDiscount[] = [
    { productId: 'prod-1', price: 10000, quantity: 2 },
    { productId: 'prod-2', price: 5000, quantity: 1 },
    { productId: 'prod-3', price: 3000, quantity: 3 },
  ];

  it('returns sum of all items when applicableProductIds is empty', () => {
    const result = calculateApplicableSubtotal(items, []);
    // 10000*2 + 5000*1 + 3000*3 = 20000 + 5000 + 9000 = 34000
    expect(result).toBe(34000);
  });

  it('returns sum of only matching items when applicableProductIds is provided', () => {
    const result = calculateApplicableSubtotal(items, ['prod-1', 'prod-3']);
    // 10000*2 + 3000*3 = 20000 + 9000 = 29000
    expect(result).toBe(29000);
  });

  it('returns 0 when no items match', () => {
    const result = calculateApplicableSubtotal(items, ['prod-99']);
    expect(result).toBe(0);
  });

  it('returns 0 for empty items array', () => {
    const result = calculateApplicableSubtotal([], []);
    expect(result).toBe(0);
  });
});

describe('calculateDiscount', () => {
  const baseCode: DiscountCodeData = {
    id: 'code-1',
    code: 'TEST10',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmountZAR: 0,
    maxUsageCount: null,
    perUserLimit: null,
    maxDiscountAmountZAR: null,
    stackable: false,
    startDate: null,
    endDate: null,
    active: true,
    applicableProductIds: [],
  };

  describe('PERCENTAGE type', () => {
    it('calculates percentage discount correctly', () => {
      const result = calculateDiscount(baseCode, 20000);
      // Math.round(20000 * 10 / 100) = 2000
      expect(result).toBe(2000);
    });

    it('caps at maxDiscountAmountZAR when set', () => {
      const code = { ...baseCode, value: 50, maxDiscountAmountZAR: 5000 };
      const result = calculateDiscount(code, 20000);
      // Math.round(20000 * 50 / 100) = 10000, capped at 5000
      expect(result).toBe(5000);
    });

    it('caps at applicable subtotal', () => {
      const code = { ...baseCode, value: 100 };
      const result = calculateDiscount(code, 15000);
      // Math.round(15000 * 100 / 100) = 15000, capped at subtotal 15000
      expect(result).toBe(15000);
    });

    it('returns 0 when applicable subtotal is 0', () => {
      const result = calculateDiscount(baseCode, 0);
      expect(result).toBe(0);
    });
  });

  describe('FIXED_AMOUNT type', () => {
    const fixedCode: DiscountCodeData = { ...baseCode, type: 'FIXED_AMOUNT', value: 5000 };

    it('applies full fixed amount when subtotal is sufficient', () => {
      const result = calculateDiscount(fixedCode, 20000);
      expect(result).toBe(5000);
    });

    it('caps at applicable subtotal when fixed amount exceeds it', () => {
      const result = calculateDiscount(fixedCode, 3000);
      expect(result).toBe(3000);
    });

    it('returns 0 when applicable subtotal is 0', () => {
      const result = calculateDiscount(fixedCode, 0);
      expect(result).toBe(0);
    });
  });

  describe('FREE_SHIPPING type', () => {
    const freeShippingCode: DiscountCodeData = { ...baseCode, type: 'FREE_SHIPPING', value: 0 };

    it('returns 0 (shipping handled separately)', () => {
      const result = calculateDiscount(freeShippingCode, 20000);
      expect(result).toBe(0);
    });
  });
});

describe('calculateTotalDiscount', () => {
  it('sums all discount amounts', () => {
    const discounts: AppliedDiscount[] = [
      { codeId: '1', code: 'A', type: 'PERCENTAGE', discountAmountZAR: 2000, isEmailCapture: false },
      { codeId: '2', code: 'B', type: 'FIXED_AMOUNT', discountAmountZAR: 3000, isEmailCapture: false },
    ];
    const result = calculateTotalDiscount(discounts, 50000);
    expect(result).toBe(5000);
  });

  it('caps total discount at cart subtotal', () => {
    const discounts: AppliedDiscount[] = [
      { codeId: '1', code: 'A', type: 'FIXED_AMOUNT', discountAmountZAR: 30000, isEmailCapture: false },
      { codeId: '2', code: 'B', type: 'FIXED_AMOUNT', discountAmountZAR: 25000, isEmailCapture: false },
    ];
    const result = calculateTotalDiscount(discounts, 40000);
    // 30000 + 25000 = 55000, capped at 40000
    expect(result).toBe(40000);
  });

  it('returns 0 for empty discounts array', () => {
    const result = calculateTotalDiscount([], 10000);
    expect(result).toBe(0);
  });
});

describe('generatePromoCode', () => {
  it('returns exactly 8 characters', () => {
    const code = generatePromoCode();
    expect(code).toHaveLength(8);
  });

  it('contains only uppercase alphanumeric characters', () => {
    const code = generatePromoCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('generates different codes on subsequent calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generatePromoCode()));
    // With 36^8 possibilities, 20 codes should all be unique
    expect(codes.size).toBe(20);
  });
});
