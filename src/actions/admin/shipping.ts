'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { invalidateShippingCache } from '@/lib/shipping';

export async function saveShippingRates(input: {
  standardRateCents: number;
  freeThresholdCents: number;
}): Promise<{ success: true } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') return { error: 'Unauthorized' };

  if (!Number.isInteger(input.standardRateCents) || input.standardRateCents < 0) return { error: 'Standard rate must be a non-negative whole number of cents.' };
  if (!Number.isInteger(input.freeThresholdCents) || input.freeThresholdCents < 0) return { error: 'Free-shipping threshold must be a non-negative whole number of cents.' };

  await prisma.$transaction([
    prisma.contentBlock.upsert({
      where: { key: 'shipping.standard_rate_cents' },
      create: { key: 'shipping.standard_rate_cents', type: 'text', value: String(input.standardRateCents), label: 'Standard shipping rate (cents)', description: 'e.g. 7500 = R75.00' },
      update: { value: String(input.standardRateCents) },
    }),
    prisma.contentBlock.upsert({
      where: { key: 'shipping.free_threshold_cents' },
      create: { key: 'shipping.free_threshold_cents', type: 'text', value: String(input.freeThresholdCents), label: 'Free-shipping threshold (cents)', description: 'e.g. 75000 = R750.00' },
      update: { value: String(input.freeThresholdCents) },
    }),
  ]);

  invalidateShippingCache();
  return { success: true };
}
