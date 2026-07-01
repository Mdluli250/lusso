import type {
  DiscountCodeData,
  CartItemForDiscount,
  AppliedDiscount,
  ValidationResult,
  ValidationError,
} from './types';
import { calculateApplicableSubtotal, calculateDiscount } from './calculate';

/**
 * Result type for stacking validation — only checks combinability,
 * doesn't calculate a discount amount.
 */
export type StackingValidationResult = { valid: true } | ValidationError;

/**
 * Validates whether a new discount code can be applied given the existing
 * applied discounts, enforcing stacking rules.
 *
 * Rules:
 * - A non-stackable code can only be applied when no other codes are applied.
 * - When a non-stackable code is already applied, no additional codes (stackable or not) are accepted.
 * - Multiple stackable codes can be combined freely.
 *
 * @param newCode - The discount code data for the code being applied
 * @param existingDiscounts - The list of currently applied discounts
 * @param hasNonStackableExisting - Whether any of the existing applied discounts is non-stackable
 */
export function validateStackingRules(
  newCode: DiscountCodeData,
  existingDiscounts: AppliedDiscount[],
  hasNonStackableExisting: boolean
): StackingValidationResult {
  // If a non-stackable code is already applied, reject any new code
  if (hasNonStackableExisting) {
    if (newCode.stackable) {
      // Requirement 4.4: stackable code attempted while non-stackable is applied
      return {
        valid: false,
        error: 'Cannot add more codes when a non-stackable discount is applied.',
      };
    }
    // Requirement 4.2: non-stackable code attempted while non-stackable is applied
    return {
      valid: false,
      error: 'This code cannot be combined with other discounts. Remove the existing code first.',
    };
  }

  // If the new code is non-stackable but other codes are already applied
  // (even if they are all stackable), reject
  if (!newCode.stackable && existingDiscounts.length > 0) {
    // Requirement 4.1: max one non-stackable code, cannot add non-stackable when others exist
    return {
      valid: false,
      error: 'This code cannot be combined with other discounts. Remove the existing code first.',
    };
  }

  // Requirement 4.3: stackable codes can be applied alongside other stackable codes
  return { valid: true };
}

/**
 * Validates all conditions for a discount code against the current cart and usage state.
 * Checks are performed in priority order; the first failing check returns the error.
 *
 * @param code - The discount code data
 * @param cartItems - Items in the cart
 * @param cartSubtotal - Total cart value in ZAR cents
 * @param currentUsageCount - Total times this code has been used globally
 * @param userUsageCount - Times the current user has used this code
 * @param now - Current date/time for temporal validation
 */
export function validateDiscountConditions(
  code: DiscountCodeData,
  cartItems: CartItemForDiscount[],
  cartSubtotal: number,
  currentUsageCount: number,
  userUsageCount: number,
  now: Date
): ValidationResult {
  // Check active status
  if (!code.active) {
    return { valid: false, error: 'This code is no longer active.' };
  }

  // Check start date
  if (code.startDate && now < code.startDate) {
    return { valid: false, error: 'This code is not yet valid.' };
  }

  // Check end date
  if (code.endDate && now > code.endDate) {
    return { valid: false, error: 'This code has expired.' };
  }

  // Check global usage limit
  if (code.maxUsageCount !== null && currentUsageCount >= code.maxUsageCount) {
    return { valid: false, error: 'This code has reached its usage limit.' };
  }

  // Check per-user usage limit
  if (code.perUserLimit !== null && userUsageCount >= code.perUserLimit) {
    return { valid: false, error: 'You have already used this code.' };
  }

  // Check minimum order amount
  if (code.minOrderAmountZAR > 0 && cartSubtotal < code.minOrderAmountZAR) {
    const amountInRands = (code.minOrderAmountZAR / 100).toFixed(0);
    return {
      valid: false,
      error: `Minimum order of R${amountInRands} required for this code.`,
    };
  }

  // Check product restrictions
  if (code.applicableProductIds.length > 0) {
    const hasMatchingProduct = cartItems.some((item) =>
      code.applicableProductIds.includes(item.productId)
    );
    if (!hasMatchingProduct) {
      return {
        valid: false,
        error: 'This code does not apply to items in your cart.',
      };
    }
  }

  // All checks pass — calculate the discount
  const applicableSubtotal = calculateApplicableSubtotal(
    cartItems,
    code.applicableProductIds
  );
  const discountAmount = calculateDiscount(code, applicableSubtotal);

  return {
    valid: true,
    discount: {
      codeId: code.id,
      code: code.code,
      type: code.type,
      discountAmountZAR: discountAmount,
      isEmailCapture: false,
    },
  };
}
