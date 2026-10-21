import { NextResponse } from 'next/server';
import { getShippingRates } from '@/lib/shipping';

/**
 * GET /api/shipping-rates
 * Public endpoint — returns current shipping configuration.
 * Cached at the edge for 5 minutes.
 */
export async function GET() {
  const rates = await getShippingRates();
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}
