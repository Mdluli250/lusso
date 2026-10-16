import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { extractClientIp, checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { generateInvoice } from '@/lib/documents/invoice-generator';
import { generateReceipt } from '@/lib/documents/receipt-generator';
import type { InvoiceData, ReceiptData } from '@/lib/documents/types';

const PEACH_WEBHOOK_SECRET = process.env.PEACH_WEBHOOK_SECRET || '';

/**
 * Verifies the HMAC-SHA256 signature Peach Orchestration attaches to each
 * webhook. The signed message is:
 *
 *   `{x-webhook-timestamp}.{x-webhook-id}.{full-request-url}.{raw-body}`
 *
 * All four headers (x-webhook-timestamp, x-webhook-id, x-webhook-signature,
 * x-webhook-signature-algorithm) are present when webhook signing is enabled
 * in the Peach Dashboard.
 *
 * Returns true when the signature is valid, or when signing is not configured
 * (with a warning).
 */
function verifySignature(
  rawBody: string,
  requestUrl: string,
  headers: Headers
): boolean {
  if (!PEACH_WEBHOOK_SECRET) {
    console.warn(
      '[Peach Webhook] PEACH_WEBHOOK_SECRET is not set — signature validation is disabled. ' +
        'Configure this in production to prevent spoofed webhook calls.'
    );
    return true;
  }

  const timestamp = headers.get('x-webhook-timestamp') ?? '';
  const webhookId = headers.get('x-webhook-id') ?? '';
  const receivedSignature = headers.get('x-webhook-signature') ?? '';

  if (!timestamp || !webhookId || !receivedSignature) {
    console.warn(
      '[Peach Webhook] Missing signature headers — rejecting request.'
    );
    return false;
  }

  const message = `${timestamp}.${webhookId}.${requestUrl}.${rawBody}`;

  const expected = createHmac('sha256', PEACH_WEBHOOK_SECRET)
    .update(message)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== receivedSignature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Parses a Peach webhook body.
 *
 * - "Checkout created" webhooks arrive as JSON.
 * - All subsequent webhooks (pending, successful, uncertain, cancelled) arrive
 *   as application/x-www-form-urlencoded.
 *
 * Both are normalised to a plain Record<string, string> to simplify handling.
 */
function parseWebhookBody(
  rawBody: string,
  contentType: string
): Record<string, string> {
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      // Flatten nested objects like result.code → keep top-level keys only
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        flat[k] = String(v ?? '');
      }
      return flat;
    } catch {
      return {};
    }
  }

  // x-www-form-urlencoded  (URLSearchParams handles percent-decoding and + → space)
  const params = new URLSearchParams(rawBody);
  const flat: Record<string, string> = {};
  for (const [k, v] of params.entries()) {
    flat[k] = v;
  }
  return flat;
}

/**
 * Maps a Peach result code to the order's new status.
 *
 * Peach Orchestration result codes:
 *   000.xxx.xxx  →  successful
 *   100.396.101  →  cancelled by user
 *   100.396.104  →  uncertain / timed-out
 *   anything else →  failed
 *
 * We only mark PAID on a definitive 000.* success. Everything else remains
 * FAILED so the merchant can investigate uncertain cases separately.
 */
function resolveOrderStatus(resultCode: string): 'PAID' | 'FAILED' | null {
  if (!resultCode) return null;
  if (resultCode.startsWith('000.')) return 'PAID';
  // Uncertain (100.396.104) and cancelled (100.396.101) are both non-payment;
  // treat as FAILED for the order record.
  return 'FAILED';
}

/**
 * POST /api/webhooks/peach
 *
 * Receives Peach Orchestration checkout webhook notifications, validates the
 * HMAC-SHA256 signature, and updates the Order record accordingly.
 *
 * Peach retries failed (non-200) deliveries with exponential back-off for up
 * to 30 days, so always return 200 once the payload has been accepted — even
 * if the order is already in a terminal state.
 */
export async function POST(request: Request): Promise<Response> {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = extractClientIp(request);
  const rateLimitResult = await checkRateLimit('webhook', ip);
  if (!rateLimitResult.allowed) {
    console.warn(`[Peach Webhook] Rate limit exceeded for ${ip}`);
    return createRateLimitResponse(rateLimitResult);
  }

  // ── Read raw body (needed for signature verification) ─────────────────────
  const rawBody = await request.text();
  const contentType = request.headers.get('content-type') ?? '';

  // ── Signature verification ─────────────────────────────────────────────────
  if (!verifySignature(rawBody, request.url, request.headers)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  const body = parseWebhookBody(rawBody, contentType);

  const merchantTransactionId = body['merchantTransactionId'];
  // result.code arrives as "result.code" key in form-encoded payloads
  const resultCode = body['result.code'] || body['result_code'] || '';
  const checkoutId = body['checkoutId'] || '';

  // The "checkout created" webhook (result code 000.200.100) is informational —
  // no order status change needed; just acknowledge it.
  if (resultCode === '000.200.100') {
    console.log(
      `[Peach Webhook] Checkout created event for checkoutId=${checkoutId} — acknowledged.`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // All other events require a merchantTransactionId to look up the order.
  if (!merchantTransactionId) {
    console.error('[Peach Webhook] Missing merchantTransactionId in payload.');
    return NextResponse.json(
      { error: 'Missing merchantTransactionId' },
      { status: 400 }
    );
  }

  // ── Look up order ──────────────────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { merchantTransactionId },
  });

  if (!order) {
    console.error(
      `[Peach Webhook] Order not found for merchantTransactionId: ${merchantTransactionId}`
    );
    // Return 200 so Peach doesn't keep retrying for orders that genuinely
    // don't exist (e.g. test webhooks from the Dashboard).
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Resolve new status ─────────────────────────────────────────────────────
  const newStatus = resolveOrderStatus(resultCode);

  if (!newStatus) {
    // Pending webhook (000.200.000) — payment in progress, no update needed.
    console.log(
      `[Peach Webhook] Pending event for order ${order.id} — no status change.`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Skip redundant writes if order is already in a terminal state.
  if (order.status === 'PAID' || order.status === 'REFUNDED') {
    console.log(
      `[Peach Webhook] Order ${order.id} is already ${order.status} — skipping update.`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── Update order ───────────────────────────────────────────────────────────
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: newStatus,
      // Store the raw result code for auditing / support queries.
      paymentStatus: resultCode,
    },
  });

  console.log(
    `[Peach Webhook] Order ${order.id} updated → ${newStatus} (code: ${resultCode})`
  );

  // ── Invoice + receipt generation on successful payment ─────────────────────
  if (newStatus === 'PAID') {
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
      // Log but don't fail — Peach would retry if we returned a non-200.
      console.error(
        `[Peach Webhook] Document generation failed for order ${order.id}:`,
        err
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
