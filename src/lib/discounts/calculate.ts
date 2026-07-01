import type { CartItemForDiscount, DiscountCodeData, AppliedDiscount } from './types';

/**
 * Calculates the subtotal for items that are applicable to a discount code.
 * If applicableProductIds is empty, ALL items are included.
 * Otherwise, only items whose productId is in the list are summed.
 */
export function calculateApplicableSubtotal(
  items: CartItemForDiscount[],
  applicableProductIds: string[]
): number {
  if (applicableProductIds.length === 0) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  return items
    .filter((item) => applicableProductIds.includes(item.productId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculates the discount amount for a single code given the applicable subtotal.
 *
 * - PERCENTAGE: min(Math.round(applicableSubtotal * value / 100), maxDiscountAmountZAR ?? Infinity),
 *   capped at the applicable subtotal.
 * - FIXED_AMOUNT: min(value, applicableSubtotal) — never exceeds applicable subtotal.
 * - FREE_SHIPPING: returns 0 (shipping cost handled separately at checkout).
 */
export function calculateDiscount(
  code: DiscountCodeData,
  applicableSubtotal: number
): number {
  switch (code.type) {
    case 'PERCENTAGE': {
      const raw = Math.round(applicableSubtotal * code.value / 100);
      const capped = code.maxDiscountAmountZAR != null
        ? Math.min(raw, code.maxDiscountAmountZAR)
        : raw;
      return Math.min(capped, applicableSubtotal);
    }
    case 'FIXED_AMOUNT': {
      return Math.min(code.value, applicableSubtotal);
    }
    case 'FREE_SHIPPING': {
      return 0;
    }
  }
}

/**
 * Sums all individual discount amounts and caps at the cart subtotal
 * so the order total never goes below zero.
 */
export function calculateTotalDiscount(
  discounts: AppliedDiscount[],
  cartSubtotal: number
): number {
  const total = discounts.reduce((sum, d) => sum + d.discountAmountZAR, 0);
  return Math.min(total, cartSubtotal);
}

/**
 * Generates a random 8-character uppercase alphanumeric promo code.
 * Characters: A-Z, 0-9.
 */
export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
