import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate, calculateSubscriptionPrice } from '@/lib/subscriptions';
import { chargeSubscriptionToken } from '@/lib/payfast-recurring';
import { sendOrderEmail } from '@/lib/email';

/**
 * POST /api/subscriptions/trigger — Cron-triggered endpoint to process due subscriptions.
 * Secured with CRON_SECRET header.
 */
export async function POST(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const expiredReservations = await prisma.order.findMany({
    where: { status: 'PENDING', reservationExpiresAt: { lte: now } },
    select: { id: true, items: true },
  });
  for (const expired of expiredReservations) {
    await prisma.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id: expired.id, status: 'PENDING', reservationExpiresAt: { lte: now } },
        data: { status: 'FAILED', paymentStatus: 'RESERVATION_EXPIRED', reservationExpiresAt: null },
      });
      if (changed.count === 1) {
        const items = expired.items as Array<{ variantId?: string; quantity: number }>;
        for (const item of items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }
    });
  }

  // Find all active subscriptions due for delivery
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextDeliveryAt: { lte: now },
    },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  const results: { subscriptionId: string; success: boolean; error?: string }[] = [];

  for (const subscription of dueSubscriptions) {
    let subscriptionChargeOrderId: string | null = null;
    try {
      const pendingRecurringOrder = await prisma.order.findFirst({
        where: { subscriptionId: subscription.id, status: 'PENDING', reservationExpiresAt: { gt: now } },
        select: { id: true },
      });
      if (pendingRecurringOrder) {
        results.push({ subscriptionId: subscription.id, success: false, error: 'A subscription charge is already pending confirmation.' });
        continue;
      }
      const originalPrice = subscription.variant.product.price;
      const discountedPrice = calculateSubscriptionPrice(originalPrice);
      const merchantTransactionId = randomUUID();
      if (!subscription.token) throw new Error('Subscription has no PayFast billing token.');
      if (!subscription.variant.product.isActive) throw new Error('Subscribed product is no longer available.');
      const shippingAddress = await prisma.shippingAddress.findUnique({ where: { userId: subscription.userId } });
      if (!shippingAddress) throw new Error('Customer delivery address is missing.');
      const shippingAmountZAR = subscription.variant.product.price >= 75000 ? 0 : 7500;

      const order = await prisma.$transaction(async (tx) => {
        const reservation = await tx.productVariant.updateMany({
          where: { id: subscription.variantId, stock: { gte: 1 } },
          data: { stock: { decrement: 1 } },
        });
        if (reservation.count !== 1) throw new Error('Product is out of stock.');
        return tx.order.create({
          data: {
          userId: subscription.userId,
          status: 'PENDING',
          totalAmountZAR: discountedPrice + shippingAmountZAR,
          merchantTransactionId,
          subscriptionId: subscription.id,
          shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
          shippingAmountZAR,
          reservationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          items: JSON.parse(
            JSON.stringify([
              {
                productId: subscription.variant.productId,
                variantId: subscription.variantId,
                name: subscription.variant.product.name,
                scent: subscription.variant.scent,
                price: discountedPrice,
                quantity: 1,
                modelPath: subscription.variant.modelPath,
                imageUrl: '',
              },
            ])
          ),
          },
        });
      });
      subscriptionChargeOrderId = order.id;

      try {
        await chargeSubscriptionToken(subscription.token, discountedPrice + shippingAmountZAR, subscription.variant.product.name, merchantTransactionId);
      } catch (chargeError) {
        console.error(`[Subscriptions] Charge result uncertain for order ${order.id}:`, chargeError);
        throw chargeError;
      }

      results.push({ subscriptionId: subscription.id, success: true });
    } catch (error) {
      // On failure: pause subscription and record reason
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const hasPendingCharge = await prisma.order.findFirst({
        where: { subscriptionId: subscription.id, status: 'PENDING', reservationExpiresAt: { gt: now } },
        select: { id: true },
      });
      const hasFailedCharge = subscriptionChargeOrderId
        ? await prisma.order.findFirst({ where: { id: subscriptionChargeOrderId, status: 'FAILED' }, select: { id: true } })
        : null;
      if (!hasPendingCharge && !hasFailedCharge) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAUSED', failureReason: errorMessage, retryCount: { increment: 1 } },
        });
      }

      const user = await prisma.user.findUnique({ where: { id: subscription.userId }, select: { email: true } });
      await sendOrderEmail(`subscription-${subscription.id}-${subscription.nextDeliveryAt?.toISOString() ?? ''}`, 'subscription-payment-failed', user?.email ?? '', 'We could not process your scheduled subscription payment. Your subscription has been paused. Please contact support to arrange payment.').catch((emailError) => console.error('[Subscriptions] Email failed:', emailError));

      results.push({ subscriptionId: subscription.id, success: false, error: errorMessage });
    }
  }

  return NextResponse.json({
    processed: dueSubscriptions.length,
    results,
  });
}
