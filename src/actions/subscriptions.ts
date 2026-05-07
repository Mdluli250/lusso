'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate } from '@/lib/subscriptions';
import type { SubscriptionFrequency } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────

interface SubscriptionData {
  id: string;
  userId: string;
  variantId: string;
  frequency: SubscriptionFrequency;
  status: string;
  nextDeliveryAt: string | null;
  createdAt: string;
}

interface SuccessResult {
  success: true;
  subscription?: SubscriptionData;
}

interface ErrorResult {
  success: false;
  error: string;
}

type ActionResult = SuccessResult | ErrorResult;

const VALID_FREQUENCIES: SubscriptionFrequency[] = ['MONTHLY', 'BI_MONTHLY', 'QUARTERLY'];

// ─── createSubscription ───────────────────────────────────────────

export async function createSubscription(data: {
  variantId: string;
  frequency: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to manage subscriptions.' };
  }

  const frequency = data.frequency.toUpperCase() as SubscriptionFrequency;
  if (!VALID_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency. Choose monthly, bi-monthly, or quarterly.' };
  }

  // Validate variant exists
  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
  });
  if (!variant) {
    return { success: false, error: 'Product variant not found.' };
  }

  const now = new Date();
  const nextDeliveryAt = calculateNextDeliveryDate(now, frequency);

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      variantId: data.variantId,
      frequency,
      status: 'ACTIVE',
      nextDeliveryAt,
    },
  });

  return {
    success: true,
    subscription: {
      id: subscription.id,
      userId: subscription.userId,
      variantId: subscription.variantId,
      frequency: subscription.frequency,
      status: subscription.status,
      nextDeliveryAt: subscription.nextDeliveryAt?.toISOString() ?? null,
      createdAt: subscription.createdAt.toISOString(),
    },
  };
}

// ─── updateSubscription ───────────────────────────────────────────

export async function updateSubscription(
  subscriptionId: string,
  action: 'pause' | 'resume' | 'cancel'
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to manage subscriptions.' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
  });

  if (!subscription) {
    return { success: false, error: 'Subscription not found.' };
  }

  if (subscription.status === 'CANCELLED') {
    return { success: false, error: 'Cannot modify a cancelled subscription.' };
  }

  switch (action) {
    case 'pause': {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'PAUSED' },
      });
      return { success: true };
    }
    case 'resume': {
      const now = new Date();
      const nextDeliveryAt = calculateNextDeliveryDate(now, subscription.frequency);
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'ACTIVE', nextDeliveryAt },
      });
      return { success: true };
    }
    case 'cancel': {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'CANCELLED', nextDeliveryAt: null },
      });
      return { success: true };
    }
    default:
      return { success: false, error: 'Invalid action.' };
  }
}

// ─── changeSubscriptionFrequency ──────────────────────────────────

export async function changeSubscriptionFrequency(
  subscriptionId: string,
  frequency: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to manage subscriptions.' };
  }

  const newFrequency = frequency.toUpperCase() as SubscriptionFrequency;
  if (!VALID_FREQUENCIES.includes(newFrequency)) {
    return { success: false, error: 'Invalid frequency. Choose monthly, bi-monthly, or quarterly.' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
  });

  if (!subscription) {
    return { success: false, error: 'Subscription not found.' };
  }

  if (subscription.status === 'CANCELLED') {
    return { success: false, error: 'Cannot modify a cancelled subscription.' };
  }

  const now = new Date();
  const nextDeliveryAt = calculateNextDeliveryDate(now, newFrequency);

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { frequency: newFrequency, nextDeliveryAt },
  });

  return { success: true };
}

// ─── swapSubscriptionProduct ──────────────────────────────────────

export async function swapSubscriptionProduct(
  subscriptionId: string,
  newVariantId: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in to manage subscriptions.' };
  }

  // Validate new variant exists
  const variant = await prisma.productVariant.findUnique({
    where: { id: newVariantId },
  });
  if (!variant) {
    return { success: false, error: 'Product variant not found.' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
  });

  if (!subscription) {
    return { success: false, error: 'Subscription not found.' };
  }

  if (subscription.status === 'CANCELLED') {
    return { success: false, error: 'Cannot modify a cancelled subscription.' };
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { variantId: newVariantId },
  });

  return { success: true };
}
