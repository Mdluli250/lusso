'use server';

import { prisma } from '@/lib/prisma';

type Result = { success: true } | { error: string };

export async function setUserRole(
  targetUserId: string,
  role: 'ADMIN' | 'CUSTOMER'
): Promise<Result> {
  const { requireAdminSession } = await import('@/lib/admin/auth');
  const auth = await requireAdminSession();
  if (!auth.ok) return { error: auth.error };
  if (auth.userId === targetUserId) {
    return { error: 'You cannot change your own role.' };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return { error: 'User not found.' };

  await prisma.user.update({ where: { id: targetUserId }, data: { role } });
  return { success: true };
}
