/**
 * Computes the status badge value for a discount code.
 *
 * A code is "valid" if and only if:
 * - active is true
 * - startDate is null OR startDate <= now
 * - endDate is null OR endDate >= now
 * - maxUsageCount is null OR usageCount < maxUsageCount
 *
 * Otherwise it is "invalid".
 *
 * Validates: Requirements 8.6
 */
export function getDiscountStatus(
  discount: {
    active: boolean;
    startDate: Date | null;
    endDate: Date | null;
    maxUsageCount: number | null;
    usageCount: number;
  },
  now: Date = new Date()
): 'valid' | 'invalid' {
  if (!discount.active) return 'invalid';
  if (discount.startDate && discount.startDate > now) return 'invalid';
  if (discount.endDate && discount.endDate < now) return 'invalid';
  if (
    discount.maxUsageCount !== null &&
    discount.usageCount >= discount.maxUsageCount
  )
    return 'invalid';
  return 'valid';
}
