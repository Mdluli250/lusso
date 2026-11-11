'use server';

import { prisma } from '@/lib/prisma';

export async function updateVariantStock(
  variantId: string,
  newStock: number
): Promise<{ success: true } | { error: string }> {
  try {
    const { requireAdminSession } = await import('@/lib/admin/auth');
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return { error: auth.error };
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
