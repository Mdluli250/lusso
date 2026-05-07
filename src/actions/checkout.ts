'use server';

import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutId } from '@/lib/peach';
import { checkRateLimit } from '@/lib/rate-limit';
import type { CartItem } from '@/types';

interface CheckoutSuccess {
  checkoutId: string;
  orderId: string;
}

interface CheckoutError {
  error: string;
}

export async function createCheckoutSession(
  cartItems: CartItem[],
  giftWrap?: { enabled: boolean; message: string }
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

    // Calculate total amount in ZAR cents
    let totalAmountZAR = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Add gift wrap cost if enabled (R49 = 4900 cents)
    const giftWrapEnabled = giftWrap?.enabled ?? false;
    const giftMessage = giftWrapEnabled
      ? (giftWrap?.message ?? '').slice(0, 200)
      : null;
    if (giftWrapEnabled) {
      totalAmountZAR += 4900;
    }

    // Generate a unique merchant transaction ID
    const merchantTransactionId = randomUUID();

    // Insert Order record with PENDING status
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        totalAmountZAR,
        merchantTransactionId,
        items: JSON.parse(JSON.stringify(cartItems)),
        giftWrap: giftWrapEnabled,
        giftMessage,
      },
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
