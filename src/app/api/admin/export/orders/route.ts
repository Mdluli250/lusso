import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/export/orders
 * Streams all orders as a CSV file. Admin only.
 */
export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  const headers = [
    'Order ID', 'Date', 'Customer Name', 'Customer Email',
    'Status', 'Payment Status', 'Fulfillment Status',
    'Total (ZAR)', 'Shipping (ZAR)', 'Refund (ZAR)',
    'Carrier', 'Tracking Number', 'Gift Wrap', 'Gift Message',
  ];

  const rows = orders.map((o) => [
    o.id,
    o.createdAt.toISOString(),
    o.user.name ?? '',
    o.user.email,
    o.status,
    o.paymentStatus ?? '',
    o.fulfillmentStatus,
    (o.totalAmountZAR / 100).toFixed(2),
    (o.shippingAmountZAR / 100).toFixed(2),
    (o.refundAmountZAR / 100).toFixed(2),
    o.carrier ?? '',
    o.trackingNumber ?? '',
    o.giftWrap ? 'Yes' : 'No',
    o.giftMessage ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lusso-orders-${date}.csv"`,
    },
  });
}
