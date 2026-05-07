import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate } from '@/lib/subscriptions';
import type { SubscriptionFrequency } from '@prisma/client';

const VALID_FREQUENCIES: SubscriptionFrequency[] = ['MONTHLY', 'BI_MONTHLY', 'QUARTERLY'];

/**
 * GET /api/subscriptions — Fetch all subscriptions for the authenticated user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in to manage subscriptions.' },
      { status: 401 }
    );
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        include: { product: { select: { name: true, slug: true, price: true, scentProfile: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(subscriptions);
}

/**
 * POST /api/subscriptions — Create a new subscription.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in to manage subscriptions.' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { variantId, frequency: rawFrequency } = body;

  if (!variantId || !rawFrequency) {
    return NextResponse.json(
      { error: 'variantId and frequency are required.' },
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

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant) {
    return NextResponse.json(
      { error: 'Product variant not found.' },
      { status: 404 }
    );
  }

  const now = new Date();
  const nextDeliveryAt = calculateNextDeliveryDate(now, frequency);

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      variantId,
      frequency,
      status: 'ACTIVE',
      nextDeliveryAt,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
