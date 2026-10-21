/**
 * Shipping rate configuration.
 * Values are read from ContentBlock CMS keys so admins can update them
 * without a code deploy. Falls back to hardcoded defaults.
 */
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  standardRateCents: 7500,       // R75
  freeShippingThresholdCents: 75000, // R750
};

let _cache: typeof DEFAULTS | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getShippingRates(): Promise<typeof DEFAULTS> {
  if (_cache && Date.now() < _cacheExpiry) return _cache;

  try {
    const rows = await prisma.contentBlock.findMany({
      where: { key: { in: ['shipping.standard_rate_cents', 'shipping.free_threshold_cents'] } },
      select: { key: true, value: true },
    });

    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    _cache = {
      standardRateCents: parseInt(map['shipping.standard_rate_cents'] ?? '') || DEFAULTS.standardRateCents,
      freeShippingThresholdCents: parseInt(map['shipping.free_threshold_cents'] ?? '') || DEFAULTS.freeShippingThresholdCents,
    };
    _cacheExpiry = Date.now() + CACHE_TTL_MS;
    return _cache;
  } catch {
    return DEFAULTS;
  }
}

export function invalidateShippingCache(): void {
  _cache = null;
  _cacheExpiry = 0;
}

export function calculateShipping(subtotalCents: number, hasFreeShippingDiscount: boolean, rates: typeof DEFAULTS): number {
  if (hasFreeShippingDiscount || subtotalCents >= rates.freeShippingThresholdCents) return 0;
  return rates.standardRateCents;
}
