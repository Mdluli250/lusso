'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidTransition } from '@/lib/admin/orderTransitions';
import type { OrderStatus } from '@prisma/client';
import { sendOrderEmail, sendDispatchEmail } from '@/lib/email';
import { refundPayFastPayment } from '@/lib/payfast-recurring';

export async function updateOrderFulfillment(input: {
  orderId: string;
  fulfillmentStatus: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  carrier?: string;
  trackingNumber?: string;
}): Promise<{ success: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') return { error: 'Unauthorized' };
  if (input.carrier && input.carrier.length > 100) return { error: 'Carrier name is too long.' };
  if (input.trackingNumber && input.trackingNumber.length > 200) return { error: 'Tracking number is too long.' };
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order || order.status !== 'PAID') return { error: 'Only paid orders can be fulfilled.' };
  const fulfillmentOrder = ['UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  if (fulfillmentOrder.indexOf(input.fulfillmentStatus) < fulfillmentOrder.indexOf(order.fulfillmentStatus)) {
    return { error: 'Fulfillment status cannot move backwards.' };
  }
  if (order.fulfillmentStatus === 'CANCELLED' || order.fulfillmentStatus === 'DELIVERED') {
    return { error: 'This order is already in a terminal fulfillment state.' };
  }
  if (input.fulfillmentStatus === 'SHIPPED' && (!input.carrier?.trim() || !input.trackingNumber?.trim())) {
    return { error: 'Carrier and tracking number are required before marking an order shipped.' };
  }
  const updated = await prisma.order.update({
    where: { id: input.orderId },
    data: {
      fulfillmentStatus: input.fulfillmentStatus,
      carrier: input.carrier?.trim() || order.carrier,
      trackingNumber: input.trackingNumber?.trim() || order.trackingNumber,
      shippedAt: input.fulfillmentStatus === 'SHIPPED' ? (order.shippedAt ?? new Date()) : order.shippedAt,
      deliveredAt: input.fulfillmentStatus === 'DELIVERED' ? (order.deliveredAt ?? new Date()) : order.deliveredAt,
    },
  });
  if (input.fulfillmentStatus === 'SHIPPED' || input.fulfillmentStatus === 'DELIVERED') {
    const customer = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } });
    await sendDispatchEmail(order.id, customer?.email ?? '', {
      orderId: order.id,
      customerName: customer?.name ?? 'Customer',
      carrier: input.carrier ?? order.carrier,
      trackingNumber: input.trackingNumber ?? order.trackingNumber,
      fulfillmentStatus: input.fulfillmentStatus,
    }).catch((error) => console.error('[Orders] Fulfillment email failed:', error));
  }
  return { success: true };
}

export async function refundOrder(input: { orderId: string; amountZAR: number; reason: string }): Promise<{ success: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') return { error: 'Unauthorized' };
  const amount = Math.round(Number(input.amountZAR) * 100);
  if (!Number.isSafeInteger(amount) || amount < 1 || !input.reason.trim() || input.reason.length > 255) return { error: 'Provide a valid refund amount and reason.' };
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order || order.status !== 'PAID') return { error: 'Only paid orders can be refunded.' };
  if (!order.payfastPaymentId) return { error: 'PayFast payment reference is not available for this order.' };
  const remaining = order.totalAmountZAR - order.refundAmountZAR;
  if (amount > remaining) return { error: 'Refund amount exceeds the remaining refundable balance.' };
  try {
    const lock = await prisma.order.updateMany({
      where: { id: order.id, status: 'PAID', refundAmountZAR: order.refundAmountZAR, paymentStatus: order.paymentStatus },
      data: { paymentStatus: 'REFUND_PENDING' },
    });
    if (lock.count !== 1) return { error: 'Another refund is already being processed. Refresh the order before trying again.' };
    await refundPayFastPayment(order.payfastPaymentId, amount, input.reason.trim());
    const totalRefund = order.refundAmountZAR + amount;
    const result = await prisma.order.updateMany({
      where: { id: order.id, status: 'PAID', refundAmountZAR: order.refundAmountZAR, paymentStatus: 'REFUND_PENDING' },
      data: {
        refundAmountZAR: totalRefund,
        refundedAt: new Date(),
        refundReference: `${order.refundReference ? `${order.refundReference},` : ''}${amount}`,
        status: totalRefund >= order.totalAmountZAR ? 'REFUNDED' : 'PAID',
      },
    });
    if (result.count !== 1) {
      await prisma.order.updateMany({ where: { id: order.id, paymentStatus: 'REFUND_PENDING' }, data: { paymentStatus: order.paymentStatus } });
      return { error: 'The order refund state changed. Refresh and verify the order before retrying.' };
    }
    return { success: true };
  } catch (error) {
    await prisma.order.updateMany({ where: { id: order.id, paymentStatus: 'REFUND_PENDING' }, data: { paymentStatus: order.paymentStatus } }).catch(() => null);
    console.error('[Orders] PayFast refund failed:', error);
    return { error: error instanceof Error ? error.message : 'Refund provider request failed.' };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: 'Order not found' };
    }

    if (newStatus === 'REFUNDED') {
      return { error: 'Use the PayFast refund form to process and record a refund.' };
    }
    if (newStatus === 'PAID') {
      return { error: 'Payment status can only be changed by a verified payment notification.' };
    }

    if (order.subscriptionId && newStatus === 'FAILED') {
      return { error: 'Subscription payment status is managed by PayFast notifications.' };
    }
    if (!isValidTransition(order.status, newStatus)) {
      return {
        error: `Invalid transition from ${order.status} to ${newStatus}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: { status: newStatus } });
      if (result.count !== 1) throw new Error('Order status changed; refresh and retry.');
      if (newStatus === 'FAILED' && order.status === 'PENDING') {
        const items = order.items as Array<{ variantId?: string; quantity: number }>;
        for (const item of items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        await tx.order.update({ where: { id: orderId }, data: { reservationExpiresAt: null } });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('updateOrderStatus failed:', error);
    return { error: 'Failed to update order status' };
  }
}
