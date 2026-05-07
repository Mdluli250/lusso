import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import path from 'path';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoice } from '@/lib/documents/invoice-generator';
import { readDocument, getStorageBasePath } from '@/lib/documents/storage';
import type { InvoiceData } from '@/lib/documents/types';

/**
 * Invoice download route handler.
 * Authenticates user, verifies ownership, and serves the invoice PDF.
 * Triggers on-demand generation if the invoice doesn't exist yet.
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

  let invoicePath = order.invoicePath;

  // If invoicePath is null, trigger on-demand generation
  if (!invoicePath) {
    const items = order.items as Array<{
      name: string;
      scent?: string;
      quantity: number;
      price: number;
    }>;

    const invoiceData: InvoiceData = {
      orderId: order.id,
      invoiceDate: new Date(),
      customerName: order.user.name || 'Customer',
      customerEmail: order.user.email,
      items: items.map((item) => ({
        name: item.name,
        scent: item.scent,
        quantity: item.quantity,
        unitPriceCents: item.price,
      })),
      subtotalCents: order.totalAmountZAR,
      totalCents: order.totalAmountZAR,
    };

    invoicePath = await generateInvoice(invoiceData);

    if (!invoicePath) {
      return NextResponse.json(
        { error: 'Failed to generate invoice' },
        { status: 500 }
      );
    }

    // Update order record with the generated path
    await prisma.order.update({
      where: { id: order.id },
      data: { invoicePath },
    });
  }

  // Read the PDF from filesystem
  try {
    const fullPath = path.resolve(getStorageBasePath(), invoicePath);
    const pdfBuffer = await readDocument(fullPath);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    console.error(`[InvoiceDownload] Failed to read invoice for order ${orderId}:`, error);
    return NextResponse.json(
      { error: 'Failed to read invoice file' },
      { status: 500 }
    );
  }
}
