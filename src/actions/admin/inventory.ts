'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function updateVariantStock(
  variantId: string,
  newStock: number
): Promise<{ success: true } | { error: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    if (newStock < 0) {
      return { error: 'Stock cannot be negative' };
    }

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: newStock },
    });

    return { success: true };
  } catch (error) {
    console.error('updateVariantStock failed:', error);
    return { error: 'Failed to update stock' };
  }
}
