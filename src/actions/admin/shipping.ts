'use server';

import { prisma } from '@/lib/prisma';
import { invalidateShippingCache } from '@/lib/shipping';

export async function saveShippingRates(input: {
  standardRateCents: number;
  freeThresholdCents: number;
}): Promise<{ success: true } | { error: string }> {
  const { requireAdminSession } = await import('@/lib/admin/auth');
  const auth = await requireAdminSession();
  if (!auth.ok) return { error: auth.error };

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
