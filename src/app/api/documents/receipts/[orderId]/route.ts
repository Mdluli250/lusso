import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReceiptPDF } from '@/lib/documents/receipt-generator';
import type { ReceiptData } from '@/lib/documents/types';

/**
 * GET /api/documents/receipts/[orderId]
 *
 * Generates and streams a receipt PDF on demand.
 * Requires the requesting user to own the order or be an admin.
 * Serverless-safe — no filesystem writes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (session.user.id !== order.userId && (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (order.status !== 'PAID') {
    return NextResponse.json({ error: 'Receipt is only available for paid orders' }, { status: 400 });
  }

  const items = Array.isArray(order.items)
    ? (order.items as Array<{ name: string; quantity: number; price: number }>)
    : [];

  const receiptData: ReceiptData = {
    orderId: order.id,
    receiptDate: order.createdAt,
    customerName: order.user.name ?? 'Customer',
    customerEmail: order.user.email,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.price,
    })),
    shippingCents: order.shippingAmountZAR ?? 0,
    totalCents: order.totalAmountZAR,
  };

  try {
    const pdfBuffer = await generateReceiptPDF(receiptData);
    const filename = `lusso-receipt-${order.id.slice(0, 8).toUpperCase()}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error(`[ReceiptDownload] Generation failed for order ${orderId}:`, err);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
