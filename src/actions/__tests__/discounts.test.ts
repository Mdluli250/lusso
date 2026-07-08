import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  CartItemForDiscount,
  AppliedDiscount,
  ValidationResult,
} from '@/lib/discounts/types';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock auth options
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock discount service
vi.mock('@/lib/discounts/service', () => ({
  validatePromoCode: vi.fn(),
  validateStackingRules: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    discountCode: {
      findUnique: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { validatePromoCode, validateStackingRules } from '@/lib/discounts/service';
import { prisma } from '@/lib/prisma';
import { applyPromoCode, removePromoCode } from '../discounts';

const mockGetServerSession = vi.mocked(getServerSession);
const mockValidatePromoCode = vi.mocked(validatePromoCode);
const mockValidateStackingRules = vi.mocked(validateStackingRules);
const mockFindUnique = vi.mocked(prisma.discountCode.findUnique);

describe('applyPromoCode', () => {
  const cartItems: CartItemForDiscount[] = [
    { productId: 'prod-1', price: 15000, quantity: 2 },
  ];
  const existingDiscounts: AppliedDiscount[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await applyPromoCode('SAVE10', cartItems, existingDiscounts);

    expect(result).toEqual({
      valid: false,
      error: 'Please sign in to apply a promo code.',
    });
  });

  it('returns error when session has no user ID', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} } as never);

    const result = await applyPromoCode('SAVE10', cartItems, existingDiscounts);

    expect(result).toEqual({
      valid: false,
      error: 'Please sign in to apply a promo code.',
    });
  });

  it('returns validation error from validatePromoCode service', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    } as never);
    mockValidatePromoCode.mockResolvedValue({
      valid: false,
      error: 'Invalid promo code.',
    });

    const result = await applyPromoCode('BADCODE', cartItems, existingDiscounts);

    expect(result).toEqual({
      valid: false,
      error: 'Invalid promo code.',
    });
    expect(mockValidatePromoCode).toHaveBeenCalledWith(
      'BADCODE',
      cartItems,
      'user-1'
    );
  });

  it('returns stacking error when stacking rules fail', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    } as never);

    const validDiscount: AppliedDiscount = {
      codeId: 'code-1',
      code: 'SAVE10',
      type: 'PERCENTAGE',
      discountAmountZAR: 3000,
      isEmailCapture: false,
    };

    mockValidatePromoCode.mockResolvedValue({
      valid: true,
      discount: validDiscount,
    });
    mockFindUnique.mockResolvedValue({ stackable: false } as never);
    mockValidateStackingRules.mockResolvedValue({
      valid: false,
      error: 'Cannot add more codes when a non-stackable discount is applied.',
    });

    const appliedNonStackable: AppliedDiscount[] = [
      {
        codeId: 'existing-1',
        code: 'EXISTING',
        type: 'FIXED_AMOUNT',
        discountAmountZAR: 5000,
        isEmailCapture: false,
      },
    ];

    const result = await applyPromoCode(
      'SAVE10',
      cartItems,
      appliedNonStackable
    );

    expect(result).toEqual({
      valid: false,
      error: 'Cannot add more codes when a non-stackable discount is applied.',
    });
  });

  it('returns success when all validations pass', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    } as never);

    const validDiscount: AppliedDiscount = {
      codeId: 'code-1',
      code: 'SAVE10',
      type: 'PERCENTAGE',
      discountAmountZAR: 3000,
      isEmailCapture: false,
    };

    mockValidatePromoCode.mockResolvedValue({
      valid: true,
      discount: validDiscount,
    });
    mockFindUnique.mockResolvedValue({ stackable: true } as never);
    mockValidateStackingRules.mockResolvedValue({ valid: true } as never);

    const result = await applyPromoCode('SAVE10', cartItems, existingDiscounts);

    expect(result).toEqual({
      valid: true,
      discount: validDiscount,
    });
  });

  it('treats email capture codes as non-stackable', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1' },
    } as never);

    const emailCaptureDiscount: AppliedDiscount = {
      codeId: 'emailcapture:WELCOME10',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      discountAmountZAR: 3000,
      isEmailCapture: true,
    };

    mockValidatePromoCode.mockResolvedValue({
      valid: true,
      discount: emailCaptureDiscount,
    });
    mockValidateStackingRules.mockResolvedValue({ valid: true } as never);

    const result = await applyPromoCode(
      'WELCOME10',
      cartItems,
      existingDiscounts
    );

    expect(result).toEqual({
      valid: true,
      discount: emailCaptureDiscount,
    });

    // Should NOT have looked up prisma for email capture codes
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

describe('removePromoCode', () => {
  it('removes the discount with matching codeId', async () => {
    const existingDiscounts: AppliedDiscount[] = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
      {
        codeId: 'code-2',
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        discountAmountZAR: 0,
        isEmailCapture: false,
      },
    ];

    const result = await removePromoCode('code-1', existingDiscounts);

    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].codeId).toBe('code-2');
  });

  it('returns empty array when removing last discount', async () => {
    const existingDiscounts: AppliedDiscount[] = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
    ];

    const result = await removePromoCode('code-1', existingDiscounts);

    expect(result.discounts).toHaveLength(0);
  });

  it('returns all discounts when codeId does not match', async () => {
    const existingDiscounts: AppliedDiscount[] = [
      {
        codeId: 'code-1',
        code: 'SAVE10',
        type: 'PERCENTAGE',
        discountAmountZAR: 3000,
        isEmailCapture: false,
      },
    ];

    const result = await removePromoCode('non-existent', existingDiscounts);

    expect(result.discounts).toHaveLength(1);
    expect(result.discounts[0].codeId).toBe('code-1');
  });

  it('handles empty existing discounts array', async () => {
    const result = await removePromoCode('code-1', []);

    expect(result.discounts).toHaveLength(0);
  });
});
