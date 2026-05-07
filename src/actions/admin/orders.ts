'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidTransition } from '@/lib/admin/orderTransitions';
import type { OrderStatus } from '@prisma/client';

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

    if (!isValidTransition(order.status, newStatus)) {
      return {
        error: `Invalid transition from ${order.status} to ${newStatus}`,
      };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    return { success: true };
  } catch (error) {
    console.error('updateOrderStatus failed:', error);
    return { error: 'Failed to update order status' };
  }
}
