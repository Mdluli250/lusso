import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import path from 'path';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReceipt } from '@/lib/documents/receipt-generator';
import { readDocument, getStorageBasePath } from '@/lib/documents/storage';
import type { ReceiptData } from '@/lib/documents/types';

/**
 * Receipt download route handler.
 * Authenticates user, verifies ownership, and serves the receipt PDF.
 * Triggers on-demand generation if the receipt doesn't exist yet.
 */
export async function GET(
  request: Request,
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

  // Verify ownership: user owns the order OR is an admin
  if (session.user.id !== order.userId && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let receiptPath = order.receiptPath;

  // If receiptPath is null, trigger on-demand generation
  if (!receiptPath) {
    const items = order.items as Array<{
      name: string;
      quantity: number;
      price: number;
    }>;

    const receiptData: ReceiptData = {
      orderId: order.id,
      receiptDate: new Date(),
      customerName: order.user.name || 'Customer',
      customerEmail: order.user.email,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.price,
      })),
      totalCents: order.totalAmountZAR,
    };

    receiptPath = await generateReceipt(receiptData);

    if (!receiptPath) {
      return NextResponse.json(
        { error: 'Failed to generate receipt' },
        { status: 500 }
      );
    }

    // Update order record with the generated path
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptPath },
    });
  }

  // Read the PDF from filesystem
  try {
    const fullPath = path.resolve(getStorageBasePath(), receiptPath);
    const pdfBuffer = await readDocument(fullPath);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error(`[ReceiptDownload] Failed to read receipt for order ${orderId}:`, error);
    return NextResponse.json(
      { error: 'Failed to read receipt file' },
      { status: 500 }
    );
  }
}
