'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Result = { success: true } | { error: string };

export async function setUserRole(
  targetUserId: string,
  role: 'ADMIN' | 'CUSTOMER'
): Promise<Result> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return { error: 'Unauthorized' };
  }
  if (session.user.id === targetUserId) {
    return { error: 'You cannot change your own role.' };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return { error: 'User not found.' };

  await prisma.user.update({ where: { id: targetUserId }, data: { role } });
  return { success: true };
}
