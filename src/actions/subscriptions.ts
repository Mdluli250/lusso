'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateNextDeliveryDate } from '@/lib/subscriptions';
import { generatePayFastUUID } from '@/lib/payfast';
import { randomUUID } from 'crypto';
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
  checkoutId?: string;
  merchantTransactionId?: string;
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

  const frequency = typeof data.frequency === 'string' ? data.frequency.toUpperCase() as SubscriptionFrequency : 'MONTHLY';
  if (!VALID_FREQUENCIES.includes(frequency)) {
    return { success: false, error: 'Invalid frequency. Choose monthly, bi-monthly, or quarterly.' };
  }

  // Validate variant exists
  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
    include: { product: true },
  });
  if (!variant || !variant.product.isActive || variant.stock < 1) {
    return { success: false, error: 'Product variant not found.' };
  }

  const now = new Date();
  const nextDeliveryAt = calculateNextDeliveryDate(now, frequency);
  const price = Math.round(variant.product.price * 0.9);
  const shippingAddress = await prisma.shippingAddress.findUnique({ where: { userId: session.user.id } });
  if (!shippingAddress) return { success: false, error: 'Add a delivery address in Account Settings before subscribing.' };
  const shippingAmountZAR = price >= 75000 ? 0 : 7500;
  const initialTotal = price + shippingAmountZAR;
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, variantId: variant.id, status: { in: ['ACTIVE', 'PAUSED'] } },
  });
  if (existingSubscription) return { success: false, error: 'You already have an active or paused subscription for this variant.' };
  const paymentId = randomUUID();
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  let stockReserved = false;

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      variantId: data.variantId,
      frequency,
      status: 'PAUSED',
      nextDeliveryAt: null,
    },
  });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const reserved = await tx.productVariant.updateMany({
        where: { id: variant.id, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
      if (reserved.count !== 1) throw new Error('Product is out of stock.');
      stockReserved = true;
      return tx.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmountZAR: initialTotal,
        merchantTransactionId: paymentId,
        items: [{ productId: variant.productId, variantId: variant.id, name: variant.product.name, scent: variant.scent, price, quantity: 1 }],
        subscriptionId: subscription.id,
        shippingAddress: JSON.parse(JSON.stringify(shippingAddress)),
        shippingAmountZAR,
        reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        fulfillmentStatus: 'UNFULFILLED',
      },
      });
    });
    const checkoutId = await generatePayFastUUID({
      m_payment_id: paymentId,
      amount: (initialTotal / 100).toFixed(2),
      item_name: variant.product.name,
      return_url: `${baseUrl}/success?merchantTransactionId=${encodeURIComponent(paymentId)}&subscription=${encodeURIComponent(subscription.id)}`,
      cancel_url: `${baseUrl}/collection`,
      notify_url: `${baseUrl}/api/webhooks/payfast`,
      email_address: session.user.email ?? '',
      name_first: session.user.name?.split(' ')[0],
      subscription_type: '2',
    });
    return { success: true, subscription: {
      id: subscription.id, userId: subscription.userId, variantId: subscription.variantId,
      frequency: subscription.frequency, status: subscription.status,
      nextDeliveryAt: null, createdAt: subscription.createdAt.toISOString(),
    }, checkoutId, merchantTransactionId: paymentId };
  } catch (error) {
    await prisma.order.delete({ where: { merchantTransactionId: paymentId } }).catch(() => null);
    // If order creation succeeded but PayFast setup failed, release its reservation.
    if (stockReserved) {
      await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: { increment: 1 } } }).catch(() => null);
    }
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => null);
    return { success: false, error: error instanceof Error ? error.message : 'Could not start subscription payment.' };
  }
}

export async function cancelPendingSubscriptionSetup(merchantTransactionId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: 'You must be signed in.' };
  const order = await prisma.order.findFirst({
    where: { merchantTransactionId, userId: session.user.id, status: 'PENDING', subscriptionId: { not: null } },
  });
  if (!order || !order.subscriptionId) return { success: false, error: 'Pending subscription setup not found.' };
  await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { status: 'FAILED', paymentStatus: 'CANCELLED_BY_CUSTOMER', reservationExpiresAt: null, fulfillmentStatus: 'CANCELLED' } });
    if (!changed.count) return;
    const items = order.items as Array<{ variantId?: string; quantity: number }>;
    for (const item of items) if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    await tx.subscription.delete({ where: { id: order.subscriptionId! } });
  });
  return { success: true };
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

  if (!subscription.token) return { success: false, error: 'Complete initial payment before changing this subscription.' };

  if (action === 'cancel' && !subscription.token) {
    const pendingOrder = await prisma.order.findFirst({ where: { subscriptionId, userId: session.user.id, status: 'PENDING' }, select: { merchantTransactionId: true } });
    if (pendingOrder) return cancelPendingSubscriptionSetup(pendingOrder.merchantTransactionId);
  }

  if (!subscription.token && action !== 'cancel') {
    return { success: false, error: 'Complete initial payment before managing this subscription.' };
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

  const newFrequency = typeof frequency === 'string' ? frequency.toUpperCase() as SubscriptionFrequency : 'MONTHLY';
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

  if (!subscription.token) return { success: false, error: 'Complete initial payment before changing this subscription.' };

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

  if (!subscription.token) return { success: false, error: 'Complete initial payment before changing this subscription.' };

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { variantId: newVariantId },
  });

  return { success: true };
}
