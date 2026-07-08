import { prisma } from '@/lib/prisma';
import type {
  DiscountCodeData,
  CartItemForDiscount,
  AppliedDiscount,
  ValidationResult,
} from './types';
import { validateDiscountConditions, validateStackingRules as validateStackingRulesPure } from './validate';

/**
 * Validates a promo code against the database and cart state.
 *
 * 1. Looks up the code in DiscountCode table (case-insensitive)
 * 2. Falls back to EmailCapture table if not found
 * 3. Delegates to pure validation logic
 *
 * @param codeString - The promo code entered by the customer
 * @param cartItems - Items in the cart for subtotal/product matching
 * @param userId - The authenticated user's ID
 */
export async function validatePromoCode(
  codeString: string,
  cartItems: CartItemForDiscount[],
  userId: string
): Promise<ValidationResult> {
  // 1. Try DiscountCode table (case-insensitive)
  const discountCode = await prisma.discountCode.findFirst({
    where: { code: { equals: codeString, mode: 'insensitive' } },
  });

  if (discountCode) {
    // Get global usage count
    const currentUsageCount = await prisma.discountUsage.count({
      where: { discountCodeId: discountCode.id },
    });

    // Get per-user usage count
    const userUsageCount = await prisma.discountUsage.count({
      where: { discountCodeId: discountCode.id, userId },
    });

    // Map DB record to DiscountCodeData
    const codeData: DiscountCodeData = {
      id: discountCode.id,
      code: discountCode.code,
      type: discountCode.type,
      value: discountCode.value,
      minOrderAmountZAR: discountCode.minOrderAmountZAR,
      maxUsageCount: discountCode.maxUsageCount,
      perUserLimit: discountCode.perUserLimit,
      maxDiscountAmountZAR: discountCode.maxDiscountAmountZAR,
      stackable: discountCode.stackable,
      startDate: discountCode.startDate,
      endDate: discountCode.endDate,
      active: discountCode.active,
      applicableProductIds: discountCode.applicableProductIds,
    };

    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return validateDiscountConditions(
      codeData,
      cartItems,
      cartSubtotal,
      currentUsageCount,
      userUsageCount,
      new Date()
    );
  }

  // 2. Fall back to EmailCapture table
  const emailCapture = await prisma.emailCapture.findFirst({
    where: { discountCode: { equals: codeString, mode: 'insensitive' } },
  });

  if (emailCapture) {
    // Check if this email capture code has already been redeemed (max 1 total)
    const emailCaptureUsageCount = await prisma.discountUsage.count({
      where: { emailCaptureCode: { equals: emailCapture.discountCode, mode: 'insensitive' } },
    });

    // Create virtual DiscountCodeData for email capture codes
    const virtualCode: DiscountCodeData = {
      id: `emailcapture:${emailCapture.discountCode}`,
      code: emailCapture.discountCode,
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

    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const result = validateDiscountConditions(
      virtualCode,
      cartItems,
      cartSubtotal,
      emailCaptureUsageCount,
      0, // per-user not applicable for email capture codes
      new Date()
    );

    // Mark as email capture in the result
    if (result.valid) {
      return {
        valid: true,
        discount: {
          ...result.discount,
          isEmailCapture: true,
        },
      };
    }

    return result;
  }

  // 3. Code not found in either table
  return { valid: false, error: 'Invalid promo code.' };
}

/**
 * Orchestrates stacking validation by determining whether any existing
 * applied discounts are non-stackable.
 *
 * Wraps the pure validateStackingRules function with the logic to
 * determine `hasNonStackableExisting` by looking up each applied
 * discount's stackable flag.
 */
export async function validateStackingRules(
  newCode: DiscountCodeData,
  existingDiscounts: AppliedDiscount[]
): Promise<ValidationResult> {
  // Determine if any existing discount is non-stackable
  let hasNonStackableExisting = false;

  for (const discount of existingDiscounts) {
    if (discount.isEmailCapture) {
      // Email capture codes are always non-stackable
      hasNonStackableExisting = true;
      break;
    }

    // Look up the discount code to check stackable flag
    const existingCode = await prisma.discountCode.findUnique({
      where: { id: discount.codeId },
      select: { stackable: true },
    });

    if (existingCode && !existingCode.stackable) {
      hasNonStackableExisting = true;
      break;
    }
  }

  const stackingResult = validateStackingRulesPure(
    newCode,
    existingDiscounts,
    hasNonStackableExisting
  );

  if (!stackingResult.valid) {
    return stackingResult;
  }

  // Stacking is valid — calculate the discount for the new code
  // We return a success with a placeholder discount (caller provides cart context)
  return { valid: true } as ValidationResult;
}

/**
 * Records a discount usage in a transaction, re-checking the usage count
 * to prevent race conditions from exceeding the max usage limit.
 *
 * For email capture codes (discountCodeId starts with "emailcapture:"),
 * sets `emailCaptureCode` and leaves `discountCodeId` null.
 */
export async function recordUsage(
  discountCodeId: string,
  userId: string,
  orderId: string,
  discountAmountZAR: number
): Promise<void> {
  const isEmailCapture = discountCodeId.startsWith('emailcapture:');

  if (isEmailCapture) {
    const emailCaptureCode = discountCodeId.replace('emailcapture:', '');

    await prisma.$transaction(async (tx) => {
      // Re-check usage count inside transaction
      const currentUsage = await tx.discountUsage.count({
        where: { emailCaptureCode: { equals: emailCaptureCode, mode: 'insensitive' } },
      });

      if (currentUsage >= 1) {
        throw new Error('This code has reached its usage limit.');
      }

      await tx.discountUsage.create({
        data: {
          emailCaptureCode: emailCaptureCode,
          userId,
          orderId,
          discountAmountZAR,
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      // Re-check usage count inside transaction
      const discountCode = await tx.discountCode.findUnique({
        where: { id: discountCodeId },
        select: { maxUsageCount: true },
      });

      if (discountCode?.maxUsageCount !== null && discountCode?.maxUsageCount !== undefined) {
        const currentUsage = await tx.discountUsage.count({
          where: { discountCodeId },
        });

        if (currentUsage >= discountCode.maxUsageCount) {
          throw new Error('This code has reached its usage limit.');
        }
      }

      await tx.discountUsage.create({
        data: {
          discountCodeId,
          userId,
          orderId,
          discountAmountZAR,
        },
      });
    });
  }
}

/**
 * Retrieves discount usage statistics for admin display.
 *
 * @param codeId - The DiscountCode ID
 * @returns Total redemptions, total discount given, and recent 10 redemptions with user email
 */
export async function getDiscountStats(codeId: string): Promise<{
  totalRedemptions: number;
  totalDiscountGiven: number;
  recentRedemptions: Array<{
    userEmail: string;
    orderId: string;
    discountAmount: number;
    date: Date;
  }>;
}> {
  // Get aggregate stats
  const [totalRedemptions, aggregation] = await Promise.all([
    prisma.discountUsage.count({
      where: { discountCodeId: codeId },
    }),
    prisma.discountUsage.aggregate({
      where: { discountCodeId: codeId },
      _sum: { discountAmountZAR: true },
    }),
  ]);

  const totalDiscountGiven = aggregation._sum.discountAmountZAR ?? 0;

  // Get recent 10 redemptions with user email
  const recentUsages = await prisma.discountUsage.findMany({
    where: { discountCodeId: codeId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      userId: true,
      orderId: true,
      discountAmountZAR: true,
      createdAt: true,
    },
  });

  // Fetch user emails for the recent redemptions
  const userIds = [...new Set(recentUsages.map((u) => u.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });

  const userEmailMap = new Map(users.map((u) => [u.id, u.email]));

  const recentRedemptions = recentUsages.map((usage) => ({
    userEmail: userEmailMap.get(usage.userId) ?? 'Unknown',
    orderId: usage.orderId,
    discountAmount: usage.discountAmountZAR,
    date: usage.createdAt,
  }));

  return {
    totalRedemptions,
    totalDiscountGiven,
    recentRedemptions,
  };
}
