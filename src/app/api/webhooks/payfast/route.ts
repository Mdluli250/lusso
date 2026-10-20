import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { extractClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { generateInvoice } from '@/lib/documents/invoice-generator';
import { generateReceipt } from '@/lib/documents/receipt-generator';
import type { InvoiceData, ReceiptData } from '@/lib/documents/types';
import { sendOrderEmail, sendOrderConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email';
import { calculateNextDeliveryDate } from '@/lib/subscriptions';
import {
  validateITNSignature,
  validateITNSourceIP,
  validateITNAmount,
  confirmITNWithPayFast,
  buildITNParamString,
} from '@/lib/payfast';

/**
 * POST /api/webhooks/payfast
 *
 * Receives PayFast Instant Transaction Notifications (ITNs), runs all four
 * recommended security checks, and updates the Order record accordingly.
 *
 * PayFast retries failed (non-200) deliveries immediately, then at 10-minute
 * intervals with exponential back-off.  Always return 200 once the payload
 * has been accepted — even for already-terminal orders — to stop retries.
 *
 * Security checks (all four must pass):
 *   1. MD5 signature verification
 *   2. Source IP resolves to a known PayFast domain
 *   3. amount_gross matches the expected order total (within R0.01)
 *   4. Server-to-server confirmation with PayFast /eng/query/validate
 *
 * @see https://developers.payfast.co.za/docs#step-4
 */
export async function POST(request: Request): Promise<Response> {
  // ── Rate limiting ────────────────────────────────────────────────────────────
  const ip = extractClientIp(request);
  const rateLimitResult = await checkRateLimit('webhook', ip);
  if (!rateLimitResult.allowed) {
    console.warn(`[PayFast ITN] Rate limit exceeded for ${ip}`);
    return createRateLimitResponse(rateLimitResult);
  }

  // ── Parse ITN body (application/x-www-form-urlencoded) ──────────────────────
  const rawBody = await request.text();

  const params = new URLSearchParams(rawBody);
  const pfData: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    pfData[k] = v;
  }

  const merchantTransactionId = pfData['m_payment_id'] ?? '';
  const paymentStatus = pfData['payment_status'] ?? '';

  if (!merchantTransactionId) {
    console.error('[PayFast ITN] Missing m_payment_id in payload.');
    // Return 200 so PayFast stops retrying a clearly malformed notification.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Look up order early so we can validate the amount ───────────────────────
  const order = await prisma.order.findUnique({
    where: { merchantTransactionId },
  });

  if (!order) {
    console.error(
      `[PayFast ITN] Order not found for m_payment_id: ${merchantTransactionId}`
    );
    // Return 200 to prevent infinite retries for unknown orders (e.g. test ITNs).
    return NextResponse.json({ received: true }, { status: 200 });
  }


  // ── Security check 1: MD5 signature ─────────────────────────────────────────
  const signatureValid = validateITNSignature(pfData);
  if (!signatureValid) {
    console.error(`[PayFast ITN] Signature mismatch for order ${order.id}.`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Security check 2: Source IP ──────────────────────────────────────────────
  // In development/sandbox the IP check is skipped when PAYFAST_SKIP_IP_CHECK=true.
  const skipIpCheck = process.env.PAYFAST_SKIP_IP_CHECK === 'true';
  if (!skipIpCheck && ip) {
    const ipValid = await validateITNSourceIP(ip);
    if (!ipValid) {
      console.error(`[PayFast ITN] Invalid source IP: ${ip} for order ${order.id}.`);
      return NextResponse.json({ error: 'Invalid source IP' }, { status: 400 });
    }
  }

  // ── Security check 3: Amount matches order total ─────────────────────────────
  const expectedAmount = (order.totalAmountZAR / 100).toFixed(2);
  const amountValid = validateITNAmount(expectedAmount, pfData);
  if (!amountValid) {
    console.error(
      `[PayFast ITN] Amount mismatch for order ${order.id}: ` +
        `expected ${expectedAmount}, got ${pfData['amount_gross']}`
    );
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  // ── Security check 4: Server-to-server confirmation ──────────────────────────
  const pfParamString = buildITNParamString(pfData);
  const confirmed = await confirmITNWithPayFast(pfParamString);
  if (!confirmed) {
    console.error(`[PayFast ITN] Server confirmation failed for order ${order.id}.`);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 400 });
  }

  // ── Map PayFast payment_status to our OrderStatus ────────────────────────────
  // PayFast sends "COMPLETE" on success and "CANCELLED" on cancellation.
  let newStatus: 'PAID' | 'FAILED' | null = null;
  if (paymentStatus === 'COMPLETE') {
    newStatus = 'PAID';
  } else if (paymentStatus === 'CANCELLED') {
    newStatus = 'FAILED';
  }
  // Any other status (e.g. pending notifications) — acknowledge but don't update.

  if (!newStatus) {
    console.log(
      `[PayFast ITN] Non-terminal payment_status "${paymentStatus}" for order ${order.id} — no update.`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Skip redundant writes for already-terminal orders ────────────────────────
  if (order.status === 'PAID' || order.status === 'REFUNDED' || order.paymentStatus === 'REFUND_PENDING') {
    console.log(
      `[PayFast ITN] Order ${order.id} is already ${order.status} — skipping update.`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }
  if (order.status !== 'PENDING') {
    console.log(`[PayFast ITN] Order ${order.id} is already terminal (${order.status}) — skipping late notification.`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Update order status ───────────────────────────────────────────────────────
  const resolvedStatus = newStatus; // narrowed: never null past this point
  const settledOrder = await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: resolvedStatus, paymentStatus, payfastPaymentId: pfData['pf_payment_id'] ?? null, reservationExpiresAt: null },
    });
    if (changed.count !== 1) return false;
    if (resolvedStatus === 'FAILED') {
      const items = order.items as Array<{ variantId?: string; quantity: number }>;
      for (const item of items) {
        if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      }
      if (order.subscriptionId) {
        await tx.subscription.update({
          where: { id: order.subscriptionId },
          data: { status: 'PAUSED', failureReason: 'Subscription payment failed.', retryCount: { increment: 1 } },
        });
      }
    }
    if (resolvedStatus === 'PAID' && order.status === 'PENDING' && order.discountData && typeof order.discountData === 'object') {
      const data = order.discountData as { codes?: Array<{ codeId: string; isEmailCapture?: boolean; amount: number }> };
      for (const code of data.codes ?? []) {
        await tx.discountUsage.createMany({
          data: [{
            discountCodeId: code.isEmailCapture ? null : code.codeId,
            emailCaptureCode: code.isEmailCapture ? code.codeId.replace('emailcapture:', '') : null,
            userId: order.userId,
            orderId: order.id,
            discountAmountZAR: code.amount,
          }],
          skipDuplicates: true,
        });
      }
    }
    if (order.subscriptionId && resolvedStatus === 'PAID') {
      const token = pfData['token'] ?? pfData['subscription_id'] ?? pfData['custom_str1'] ?? null;
      const subscription = await tx.subscription.findUnique({ where: { id: order.subscriptionId } });
      const isInitialSubscriptionPayment = subscription?.token == null;
      await tx.subscription.update({
        where: { id: order.subscriptionId },
        data: {
          status: isInitialSubscriptionPayment && !token ? 'PAUSED' : 'ACTIVE',
          token: token ?? subscription?.token,
          nextDeliveryAt: subscription ? calculateNextDeliveryDate(new Date(), subscription.frequency) : null,
          lastChargedAt: new Date(),
          failureReason: isInitialSubscriptionPayment && !token ? 'PayFast did not return a recurring billing token.' : null,
        },
      });
      if (isInitialSubscriptionPayment && !token) {
        await tx.order.update({ where: { id: order.id }, data: { fulfillmentStatus: 'CANCELLED' } });
      } else if (isInitialSubscriptionPayment && token) {
        await tx.order.update({ where: { id: order.id }, data: { fulfillmentStatus: 'PROCESSING' } });
      }
    }
    if (order.subscriptionId && resolvedStatus === 'FAILED') {
      const subscription = await tx.subscription.findUnique({ where: { id: order.subscriptionId } });
      if (subscription?.token == null) {
        await tx.subscription.delete({ where: { id: order.subscriptionId } });
      } else {
        await tx.subscription.update({
          where: { id: order.subscriptionId },
          data: { status: 'PAUSED', failureReason: 'Initial subscription payment failed.', retryCount: { increment: 1 } },
        });
      }
    }
    return true;
  });

  if (!settledOrder) return NextResponse.json({ received: true }, { status: 200 });

  console.log(
    `[PayFast ITN] Order ${order.id} updated → ${resolvedStatus} (payment_status: ${paymentStatus})`
  );

  // ── Generate invoice + receipt on successful payment ─────────────────────────
  if (resolvedStatus === 'PAID') {
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
          variantId?: string;
        }>;

        await sendOrderConfirmationEmail(orderWithUser.id, orderWithUser.user.email, {
          orderId: orderWithUser.id,
          customerName: orderWithUser.user.name || 'Customer',
          items: items.map((item) => ({
            name: item.name,
            scent: item.scent,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotalCents: Math.max(orderWithUser.totalAmountZAR - orderWithUser.shippingAmountZAR, 0),
          shippingCents: orderWithUser.shippingAmountZAR,
          totalCents: orderWithUser.totalAmountZAR,
          shippingAddress: orderWithUser.shippingAddress as any,
        }).catch((emailError) => console.error('[PayFast ITN] Confirmation email failed:', emailError));

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
          subtotalCents: Math.max(orderWithUser.totalAmountZAR - orderWithUser.shippingAmountZAR, 0),
          totalCents: orderWithUser.totalAmountZAR,
          shippingCents: orderWithUser.shippingAmountZAR,
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
          shippingCents: orderWithUser.shippingAmountZAR,
        };

        const [invoicePath, receiptPath] = await Promise.all([
          generateInvoice(invoiceData),
          generateReceipt(receiptData),
        ]);

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
    } catch (err) {
      // Log but don't fail — PayFast would retry if we returned non-200.
      console.error(
        `[PayFast ITN] Document generation failed for order ${order.id}:`,
        err
      );
    }
  }

  if (resolvedStatus === 'FAILED') {
    const failedUser = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true, name: true } });
    await sendPaymentFailedEmail(order.id, failedUser?.email ?? '', failedUser?.name ?? 'Customer')
      .catch((error) => console.error('[PayFast ITN] Failure notice error:', error));
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
