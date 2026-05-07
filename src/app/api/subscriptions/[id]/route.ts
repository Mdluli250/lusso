import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate } from '@/lib/subscriptions';
import type { SubscriptionFrequency } from '@prisma/client';

const VALID_FREQUENCIES: SubscriptionFrequency[] = ['MONTHLY', 'BI_MONTHLY', 'QUARTERLY'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/subscriptions/[id] — Update a subscription.
 * Supports actions: pause, resume, cancel, changeFrequency, swapProduct
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in to manage subscriptions.' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { action, frequency: rawFrequency, variantId } = body;

  const subscription = await prisma.subscription.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: 'Subscription not found.' },
      { status: 404 }
    );
  }

  if (subscription.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Cannot modify a cancelled subscription.' },
      { status: 400 }
    );
  }

  switch (action) {
    case 'pause': {
      const updated = await prisma.subscription.update({
        where: { id },
        data: { status: 'PAUSED' },
      });
      return NextResponse.json(updated);
    }
    case 'resume': {
      const now = new Date();
      const nextDeliveryAt = calculateNextDeliveryDate(now, subscription.frequency);
      const updated = await prisma.subscription.update({
        where: { id },
        data: { status: 'ACTIVE', nextDeliveryAt },
      });
      return NextResponse.json(updated);
    }
    case 'cancel': {
      const updated = await prisma.subscription.update({
        where: { id },
        data: { status: 'CANCELLED', nextDeliveryAt: null },
      });
      return NextResponse.json(updated);
    }
    case 'changeFrequency': {
      if (!rawFrequency) {
        return NextResponse.json(
          { error: 'frequency is required for changeFrequency action.' },
          { status: 400 }
        );
      }
      const frequency = rawFrequency.toUpperCase() as SubscriptionFrequency;
      if (!VALID_FREQUENCIES.includes(frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency. Choose monthly, bi-monthly, or quarterly.' },
          { status: 400 }
        );
      }
      const now = new Date();
      const nextDeliveryAt = calculateNextDeliveryDate(now, frequency);
      const updated = await prisma.subscription.update({
        where: { id },
        data: { frequency, nextDeliveryAt },
      });
      return NextResponse.json(updated);
    }
    case 'swapProduct': {
      if (!variantId) {
        return NextResponse.json(
          { error: 'variantId is required for swapProduct action.' },
          { status: 400 }
        );
      }
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant) {
        return NextResponse.json(
          { error: 'Product variant not found.' },
          { status: 404 }
        );
      }
      const updated = await prisma.subscription.update({
        where: { id },
        data: { variantId },
      });
      return NextResponse.json(updated);
    }
    default:
      return NextResponse.json(
        { error: 'Invalid action. Use pause, resume, cancel, changeFrequency, or swapProduct.' },
        { status: 400 }
      );
  }
}
