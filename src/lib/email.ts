import { prisma } from '@/lib/prisma';
import {
  buildOrderConfirmationEmail,
  buildDispatchEmail,
  buildPaymentFailedEmail,
  buildPasswordResetEmail,
  type OrderEmailData,
  type DispatchEmailData,
} from '@/lib/email-templates';

/**
 * Send a transactional email via Resend with HTML body.
 * Deduplicates via NotificationLog so retries are safe.
 */
async function sendEmail(params: {
  key: string;
  type: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!params.recipient || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.info(`[Email] Skipped ${params.type}; RESEND_API_KEY/EMAIL_FROM not configured.`);
    return;
  }

  const existing = await prisma.notificationLog.findUnique({ where: { key: params.key } });
  if (existing) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [params.recipient],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
  }

  await prisma.notificationLog.create({
    data: { key: params.key, type: params.type, recipient: params.recipient },
  });
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Legacy plain-text helper — kept for callers that haven't been migrated yet.
 * New code should use the typed helpers below.
 */
export async function sendOrderEmail(
  orderId: string,
  type: string,
  recipient: string,
  message: string
): Promise<void> {
  if (!recipient || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.info(`[Email] Skipped ${type} for order ${orderId}; RESEND_API_KEY/EMAIL_FROM not configured.`);
    return;
  }
  const key = `${orderId}:${type}`;
  const existing = await prisma.notificationLog.findUnique({ where: { key } });
  if (existing) return;

  const subjects: Record<string, string> = {
    'payment-confirmation': 'Your Lusso order is confirmed 🕯️',
    'payment-failed': 'Payment unsuccessful — Lusso',
    'subscription-payment-failed': 'Subscription payment failed — Lusso',
    'fulfillment-shipped': 'Your Lusso order has shipped 📦',
    'fulfillment-delivered': 'Your Lusso order has been delivered',
    'password-reset': 'Reset your Lusso password',
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [recipient],
      subject: subjects[type] ?? 'Update on your Lusso order',
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
  }

  await prisma.notificationLog.create({ data: { key, type, recipient } });
}

export async function sendOrderConfirmationEmail(
  orderId: string,
  recipient: string,
  data: OrderEmailData
): Promise<void> {
  const { subject, html, text } = buildOrderConfirmationEmail(data);
  await sendEmail({ key: `${orderId}:payment-confirmation`, type: 'payment-confirmation', recipient, subject, html, text });
}

export async function sendDispatchEmail(
  orderId: string,
  recipient: string,
  data: DispatchEmailData
): Promise<void> {
  const type = `fulfillment-${data.fulfillmentStatus.toLowerCase()}`;
  const { subject, html, text } = buildDispatchEmail(data);
  await sendEmail({ key: `${orderId}:${type}`, type, recipient, subject, html, text });
}

export async function sendPaymentFailedEmail(
  orderId: string,
  recipient: string,
  customerName: string
): Promise<void> {
  const { subject, html, text } = buildPaymentFailedEmail({ orderId, customerName });
  await sendEmail({ key: `${orderId}:payment-failed`, type: 'payment-failed', recipient, subject, html, text });
}

export async function sendPasswordResetEmail(
  userId: string,
  recipient: string,
  resetUrl: string
): Promise<void> {
  const { subject, html, text } = buildPasswordResetEmail({ resetUrl });
  await sendEmail({ key: `reset-${userId}`, type: 'password-reset', recipient, subject, html, text });
}
