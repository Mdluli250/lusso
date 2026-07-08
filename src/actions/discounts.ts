'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type {
  CartItemForDiscount,
  AppliedDiscount,
  ValidationResult,
} from '@/lib/discounts/types';
import {
  validatePromoCode,
  validateStackingRules,
} from '@/lib/discounts/service';

/**
 * Customer-facing server action to apply a promo code to the cart.
 *
 * Validates the code against the database and checks stacking rules
 * before returning the result to the client.
 *
 * @param code - The promo code string entered by the customer
 * @param cartItems - Current cart items for subtotal/product matching
 * @param existingDiscounts - Already-applied discounts for stacking validation
 */
export async function applyPromoCode(
  code: string,
  cartItems: CartItemForDiscount[],
  existingDiscounts: AppliedDiscount[]
): Promise<ValidationResult> {
  // Require authenticated user
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { valid: false, error: 'Please sign in to apply a promo code.' };
  }

  const userId = session.user.id;

  // Validate the code against DB conditions (existence, active, dates, usage, min order, products)
  const validationResult = await validatePromoCode(code, cartItems, userId);

  if (!validationResult.valid) {
    return validationResult;
  }

  // Check stacking rules against existing applied discounts
  // We need to look up the code data to pass to stacking validation
  // The validationResult.discount contains the codeId which we can use
  const newCodeData = {
    id: validationResult.discount.codeId,
    code: validationResult.discount.code,
    type: validationResult.discount.type,
    // For stacking, the key field is `stackable` — we need to determine it.
    // Email capture codes are always non-stackable.
    // For DB codes, we look it up from the database via the service.
    stackable: !validationResult.discount.isEmailCapture,
    // The remaining fields aren't needed for stacking validation,
    // but we satisfy the type interface:
    value: 0,
    minOrderAmountZAR: 0,
    maxUsageCount: null,
    perUserLimit: null,
    maxDiscountAmountZAR: null,
    startDate: null,
    endDate: null,
    active: true,
    applicableProductIds: [] as string[],
  };

  // For non-email-capture codes, look up the actual stackable flag
  if (!validationResult.discount.isEmailCapture) {
    const { prisma } = await import('@/lib/prisma');
    const dbCode = await prisma.discountCode.findUnique({
      where: { id: validationResult.discount.codeId },
      select: { stackable: true },
    });
    if (dbCode) {
      newCodeData.stackable = dbCode.stackable;
    }
  }

  const stackingResult = await validateStackingRules(
    newCodeData,
    existingDiscounts
  );

  if (!stackingResult.valid) {
    return stackingResult;
  }

  // All validations passed — return success with the discount
  return validationResult;
}

/**
 * Customer-facing server action to remove a promo code from applied discounts.
 *
 * Filters out the discount with the matching codeId and returns the updated list.
 *
 * @param codeId - The ID of the discount code to remove
 * @param existingDiscounts - The current list of applied discounts
 */
export async function removePromoCode(
  codeId: string,
  existingDiscounts: AppliedDiscount[]
): Promise<{ discounts: AppliedDiscount[] }> {
  const updatedDiscounts = existingDiscounts.filter(
    (discount) => discount.codeId !== codeId
  );

  return { discounts: updatedDiscounts };
}
