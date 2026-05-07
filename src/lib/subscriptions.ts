import type { SubscriptionFrequency } from '@prisma/client';

/**
 * Subscription utility functions and constants.
 */

export const FREQUENCY_DAYS: Record<SubscriptionFrequency, number> = {
  MONTHLY: 30,
  BI_MONTHLY: 60,
  QUARTERLY: 90,
};

export const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

/**
 * Calculate the discounted subscription price.
 * @param priceZARCents - Original price in ZAR cents (positive integer)
 * @returns Discounted price in ZAR cents
 */
export function calculateSubscriptionPrice(priceZARCents: number): number {
  return Math.round(priceZARCents * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100));
}

/**
 * Calculate the next delivery date based on a base date and frequency.
 * @param baseDate - The starting date
 * @param frequency - The subscription frequency
 * @returns The next delivery date
 */
export function calculateNextDeliveryDate(
  baseDate: Date,
  frequency: SubscriptionFrequency
): Date {
  const days = FREQUENCY_DAYS[frequency];
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}
