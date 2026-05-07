import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { validateWebhookSignature } from '@/lib/peach';
import { extractClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { generateInvoice } from '@/lib/documents/invoice-generator';
import { generateReceipt } from '@/lib/documents/receipt-generator';
import type { InvoiceData, ReceiptData } from '@/lib/documents/types';

/**
 * Peach Payments webhook handler.
 * Receives POST notifications with payment status updates,
 * validates the HMAC-SHA256 signature, and updates the Order record.
 */
export async function POST(request: Request): Promise<Response> {
  // Rate limit check
  const ip = extractClientIp(request);
  const rateLimitResult = await checkRateLimit('webhook', ip);
  if (!rateLimitResult.allowed) {
    console.warn(`[RateLimit] Rejected ${ip} on /api/webhooks/peach`);
    return createRateLimitResponse(rateLimitResult);
  }

  // Read raw request body for signature validation
  const payload = await request.text();

  // Extract the signature header
  const receivedSignature = request.headers.get('X-Signature') ?? '';

  // Validate HMAC-SHA256 signature
  if (!validateWebhookSignature(payload, receivedSignature)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Parse the payload
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const merchantTransactionId = body.merchantTransactionId as string | undefined;
  const paymentStatus = body.paymentStatus as string | undefined;

  if (!merchantTransactionId || !paymentStatus) {
    return NextResponse.json(
      { error: 'Missing merchantTransactionId or paymentStatus' },
      { status: 400 }
    );
  }

  // Look up the Order by merchantTransactionId
  const order = await prisma.order.findUnique({
    where: { merchantTransactionId },
  });

  if (!order) {
    console.error(
      `[Peach Webhook] Order not found for merchantTransactionId: ${merchantTransactionId}`
    );
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // Determine the new order status based on paymentStatus
  // Peach Payments uses result codes — codes starting with "000." indicate success
  const isSuccessful =
    paymentStatus.startsWith('000.') ||
    paymentStatus === 'paid' ||
    paymentStatus === 'success';

  const newStatus = isSuccessful ? 'PAID' : 'FAILED';

  // Update the Order record
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      paymentStatus,
    },
  });

  // Trigger invoice and receipt generation on PAID status transition
  if (isSuccessful) {
    try {
      const orderWithUser = await prisma.order.findUnique({
        where: { id: order.id },
        include: { user: { select: { name: true, email: true } } },
      });

      if (orderWithUser) {
        const items = orderWithUser.items as Array<{
          name: string;
          scent?: string;
          quantity: number;
          price: number;
        }>;

        const invoiceData: InvoiceData = {
          orderId: orderWithUser.id,
          invoiceDate: new Date(),
          customerName: orderWithUser.user.name || 'Customer',
          customerEmail: orderWithUser.user.email,
          items: items.map((item) => ({
            name: item.name,
            scent: item.scent,
            quantity: item.quantity,
            unitPriceCents: item.price,
          })),
          subtotalCents: orderWithUser.totalAmountZAR,
          totalCents: orderWithUser.totalAmountZAR,
        };

        const receiptData: ReceiptData = {
          orderId: orderWithUser.id,
          receiptDate: new Date(),
          customerName: orderWithUser.user.name || 'Customer',
          customerEmail: orderWithUser.user.email,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.price,
          })),
          totalCents: orderWithUser.totalAmountZAR,
        };

        const [invoicePath, receiptPath] = await Promise.all([
          generateInvoice(invoiceData),
          generateReceipt(receiptData),
        ]);

        // Update order with document paths (only if generation succeeded)
        const updateData: { invoicePath?: string; receiptPath?: string } = {};
        if (invoicePath) updateData.invoicePath = invoicePath;
        if (receiptPath) updateData.receiptPath = receiptPath;

        if (Object.keys(updateData).length > 0) {
          await prisma.order.update({
            where: { id: order.id },
            data: updateData,
          });
        }
      }
    } catch (error) {
      // Log errors but do NOT fail the webhook response
      console.error(
        `[Peach Webhook] Document generation failed for order ${order.id}:`,
        error
      );
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
