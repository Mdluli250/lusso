import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

/**
 * GET /api/orders/[merchantTransactionId]/status
 *
 * Returns the current status of a single order, identified by its
 * merchantTransactionId. Only the owner of the order may query it.
 *
 * Used by SuccessClient to poll until the webhook has settled the order
 * from PENDING → PAID / FAILED, resolving the race condition between the
 * shopper redirect and the Peach webhook delivery.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ merchantTransactionId: string }> }
) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const identifier = session.user.id;
  const ip = extractClientIp(request);
  const rateLimitResult = await checkRateLimit('orders', ip || identifier);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  // ── Fetch order ─────────────────────────────────────────────────────────────
  const { merchantTransactionId } = await params;

  const order = await prisma.order.findUnique({
    where: { merchantTransactionId },
    select: {
      id: true,
      status: true,
      userId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Ensure the requesting user owns this order
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ status: order.status }, { status: 200 });
}
