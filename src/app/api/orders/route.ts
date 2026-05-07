import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

/**
 * GET /api/orders — returns the authenticated user's orders sorted by
 * createdAt descending. Used by the OrderHistory component for polling.
 *
 * Requirements: 9.1, 9.3
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Determine rate limit identifier and config override
  let identifier: string;
  let endpointKey = 'orders';
  let limitOverride: number | undefined;

  if (session?.user?.id) {
    identifier = session.user.id;
  } else {
    identifier = extractClientIp(request);
    limitOverride = RATE_LIMIT_CONFIG[endpointKey]?.unauthenticatedLimit;
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(endpointKey, identifier);

  // Apply unauthenticated limit override if applicable
  let effectiveResult = rateLimitResult;
  if (limitOverride !== undefined && !session?.user?.id) {
    // The store counted against the full limit (30), but we enforce a lower limit (10) for unauthenticated
    const currentCount = rateLimitResult.limit - rateLimitResult.remaining;
    const effectiveAllowed = currentCount <= limitOverride;
    const effectiveRemaining = Math.max(0, limitOverride - currentCount);
    effectiveResult = {
      ...rateLimitResult,
      allowed: effectiveAllowed,
      limit: limitOverride,
      remaining: effectiveRemaining,
    };
  }

  // Rate limit headers to include on all responses
  const rateLimitHeaders = {
    'X-RateLimit-Limit': String(effectiveResult.limit),
    'X-RateLimit-Remaining': String(effectiveResult.remaining),
    'X-RateLimit-Reset': String(effectiveResult.resetAt),
  };

  if (!effectiveResult.allowed) {
    const response = createRateLimitResponse(effectiveResult);
    return response;
  }

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimitHeaders }
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      totalAmountZAR: true,
      status: true,
    },
  });

  return NextResponse.json(orders, { headers: rateLimitHeaders });
}
