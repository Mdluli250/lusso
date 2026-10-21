'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Result = { success: true } | { error: string };

// ─── Customer: cancel PENDING order ─────────────────────────────────────────

export async function cancelOrder(orderId: string): Promise<Result> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'You must be signed in.' };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });

  if (!order) return { error: 'Order not found.' };
  if (order.status !== 'PENDING') return { error: 'Only orders awaiting payment can be cancelled.' };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'FAILED', paymentStatus: 'CANCELLED_BY_CUSTOMER' },
    });
    // Restore inventory
    const items = order.items as Array<{ variantId?: string; quantity: number }>;
    for (const item of items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
  });

  return { success: true };
}

// ─── Customer: request return ────────────────────────────────────────────────

export async function requestReturn(input: {
  orderId: string;
  reason: string;
  items: Array<{ name: string; quantity: number }>;
}): Promise<Result> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'You must be signed in.' };

  const reason = input.reason.trim();
  if (!reason || reason.length < 10) return { error: 'Please describe the reason for your return (at least 10 characters).' };
  if (reason.length > 1000) return { error: 'Reason is too long.' };
  if (!input.items.length) return { error: 'Select at least one item to return.' };

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: session.user.id },
  });

  if (!order) return { error: 'Order not found.' };
  if (order.status !== 'PAID') return { error: 'Only paid orders are eligible for returns.' };

  // 14-day window
  const deliveredOrPaid = order.updatedAt;
  const daysSince = (Date.now() - deliveredOrPaid.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 14) return { error: 'The 14-day return window has passed for this order.' };

  // One return request per order
  const existing = await prisma.returnRequest.findFirst({ where: { orderId: input.orderId } });
  if (existing) return { error: 'A return request has already been submitted for this order.' };

  await prisma.returnRequest.create({
    data: {
      orderId: input.orderId,
      userId: session.user.id,
      reason,
      items: JSON.parse(JSON.stringify(input.items)),
      status: 'PENDING',
    },
  });

  return { success: true };
}

// ─── Admin: update return request status ────────────────────────────────────

export async function updateReturnStatus(input: {
  returnId: string;
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote?: string;
}): Promise<Result> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') return { error: 'Unauthorized' };

  const ret = await prisma.returnRequest.findUnique({ where: { id: input.returnId } });
  if (!ret) return { error: 'Return request not found.' };

  await prisma.returnRequest.update({
    where: { id: input.returnId },
    data: {
      status: input.status,
      adminNote: input.adminNote?.trim() || null,
    },
  });

  return { success: true };
}
