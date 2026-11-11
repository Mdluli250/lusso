import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/admin/auth';

/**
 * GET /api/admin/export/orders
 * Streams all orders as a CSV file. Admin only.
 */
export async function GET(): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

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
