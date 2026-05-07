import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate, calculateSubscriptionPrice } from '@/lib/subscriptions';

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
    try {
      const originalPrice = subscription.variant.product.price;
      const discountedPrice = calculateSubscriptionPrice(originalPrice);
      const merchantTransactionId = randomUUID();

      // Create order with discounted price
      await prisma.order.create({
        data: {
          userId: subscription.userId,
          status: 'PAID',
          totalAmountZAR: discountedPrice,
          merchantTransactionId,
          subscriptionId: subscription.id,
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

      // Advance next delivery date
      const nextDeliveryAt = calculateNextDeliveryDate(
        subscription.nextDeliveryAt!,
        subscription.frequency
      );

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { nextDeliveryAt },
      });

      results.push({ subscriptionId: subscription.id, success: true });
    } catch (error) {
      // On failure: pause subscription and record reason
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'PAUSED',
          failureReason: errorMessage,
        },
      });

      results.push({ subscriptionId: subscription.id, success: false, error: errorMessage });
    }
  }

  return NextResponse.json({
    processed: dueSubscriptions.length,
    results,
  });
}
