'use server';

import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutId } from '@/lib/peach';
import { checkRateLimit } from '@/lib/rate-limit';
import { validatePromoCode } from '@/lib/discounts/service';
import { calculateTotalDiscount } from '@/lib/discounts/calculate';
import type { AppliedDiscount, CartItemForDiscount } from '@/lib/discounts/types';
import type { CartItem } from '@/types';

interface CheckoutSuccess {
  checkoutId?: string;
  orderId: string;
}

interface CheckoutError {
  error: string;
}

export async function createCheckoutSession(
  cartItems: CartItem[],
  giftWrap?: { enabled: boolean; message: string },
  appliedDiscounts?: AppliedDiscount[]
): Promise<CheckoutSuccess | CheckoutError> {
  try {
    // Validate cart is non-empty
    if (!cartItems || cartItems.length === 0) {
      return { error: 'Cart is empty. Please add items before checking out.' };
    }

    // Get authenticated user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: 'You must be signed in to checkout.' };
    }

    const userId = session.user.id;

    // Rate limit check (after session check — reject unauthenticated first)
    const rateLimitResult = await checkRateLimit('checkout', userId);
    if (!rateLimitResult.allowed) {
      console.warn(`[RateLimit] Checkout rejected for user ${session.user.id}`);
      return { error: 'Too many checkout attempts. Please wait before trying again.' };
    }

    // Map CartItems to CartItemForDiscount for validation
    const cartItemsForDiscount: CartItemForDiscount[] = cartItems.map((item) => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
    }));

    // Re-validate applied discount codes server-side
    if (appliedDiscounts && appliedDiscounts.length > 0) {
      for (const discount of appliedDiscounts) {
        const result = await validatePromoCode(
          discount.code,
          cartItemsForDiscount,
          userId
        );
        if (!result.valid) {
          return {
            error: `Discount code '${discount.code}' is no longer valid: ${result.error}. Please remove it and try again.`,
          };
        }
      }
    }

    // Calculate cart subtotal in ZAR cents
    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate total discount
    const totalDiscount =
      appliedDiscounts && appliedDiscounts.length > 0
        ? calculateTotalDiscount(appliedDiscounts, cartSubtotal)
        : 0;

    // Calculate final total: max(subtotal - discount, 0) + gift wrap
    const giftWrapEnabled = giftWrap?.enabled ?? false;
    const giftMessage = giftWrapEnabled
      ? (giftWrap?.message ?? '').slice(0, 200)
      : null;
    const giftWrapCost = giftWrapEnabled ? 4900 : 0;

    const totalAmountZAR = Math.max(cartSubtotal - totalDiscount, 0) + giftWrapCost;

    // Build discount metadata for the order
    const discountData =
      appliedDiscounts && appliedDiscounts.length > 0
        ? {
            codes: appliedDiscounts.map((d) => ({
              code: d.code,
              type: d.type,
              amount: d.discountAmountZAR,
            })),
            totalDiscount,
          }
        : undefined;

    // Generate a unique merchant transaction ID
    const merchantTransactionId = randomUUID();

    // If total is zero, skip payment gateway — mark order as PAID directly
    if (totalAmountZAR === 0) {
      const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId,
            status: 'PAID',
            totalAmountZAR,
            merchantTransactionId,
            items: JSON.parse(JSON.stringify(cartItems)),
            giftWrap: giftWrapEnabled,
            giftMessage,
            discountData: discountData ?? undefined,
          },
        });

        // Record usage for each applied discount
        if (appliedDiscounts && appliedDiscounts.length > 0) {
          for (const discount of appliedDiscounts) {
            await tx.discountUsage.create({
              data: {
                discountCodeId: discount.isEmailCapture ? undefined : discount.codeId,
                emailCaptureCode: discount.isEmailCapture
                  ? discount.codeId.replace('emailcapture:', '')
                  : undefined,
                userId,
                orderId: createdOrder.id,
                discountAmountZAR: discount.discountAmountZAR,
              },
            });
          }
        }

        return createdOrder;
      });

      return { orderId: order.id };
    }

    // Insert Order record with PENDING status (inside transaction with usage records)
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          totalAmountZAR,
          merchantTransactionId,
          items: JSON.parse(JSON.stringify(cartItems)),
          giftWrap: giftWrapEnabled,
          giftMessage,
          discountData: discountData ?? undefined,
        },
      });

      // Record usage for each applied discount
      if (appliedDiscounts && appliedDiscounts.length > 0) {
        for (const discount of appliedDiscounts) {
          await tx.discountUsage.create({
            data: {
              discountCodeId: discount.isEmailCapture ? undefined : discount.codeId,
              emailCaptureCode: discount.isEmailCapture
                ? discount.codeId.replace('emailcapture:', '')
                : undefined,
              userId,
              orderId: createdOrder.id,
              discountAmountZAR: discount.discountAmountZAR,
            },
          });
        }
      }

      return createdOrder;
    });

    // Convert cents to decimal string for Peach Payments (e.g. 34900 → "349.00")
    const amountDecimal = (totalAmountZAR / 100).toFixed(2);

    // Create checkout ID via Peach Payments API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutId = await createCheckoutId({
      amount: amountDecimal,
      currency: 'ZAR',
      merchantTransactionId,
      shopperResultUrl: `${baseUrl}/success?merchantTransactionId=${merchantTransactionId}`,
    });

    return { checkoutId, orderId: order.id };
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return {
      error:
        'Failed to create checkout session. Please try again.',
    };
  }
}
