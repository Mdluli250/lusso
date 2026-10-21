/**
 * HTML email templates for Lusso transactional emails.
 * Designed to render correctly in major email clients (table-based layout).
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'https://lusso.co.za';

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f9f6f2;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f2;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
      <!-- Header -->
      <tr>
        <td style="background:#1a1208;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:#f9f6f2;letter-spacing:2px;">LUSSO</span>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="background:#ffffff;padding:32px;border-left:1px solid #e8e0d8;border-right:1px solid #e8e0d8;">
          ${bodyHtml}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f0ebe4;border-radius:0 0 12px 12px;border:1px solid #e8e0d8;border-top:none;padding:20px 32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#8a7b6e;">
            Lusso Candles · Centurion, South Africa
          </p>
          <p style="margin:0;font-size:11px;color:#b0a090;">
            <a href="${BASE_URL}/privacy" style="color:#8a7b6e;text-decoration:underline;">Privacy Policy</a>
            &nbsp;·&nbsp;
            <a href="${BASE_URL}/terms" style="color:#8a7b6e;text-decoration:underline;">Terms</a>
            &nbsp;·&nbsp;
            <a href="${BASE_URL}/contact" style="color:#8a7b6e;text-decoration:underline;">Contact us</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function divider(): string {
  return '<hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;" />';
}

// ─── Order Confirmation ───────────────────────────────────────────────────────

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  items: Array<{ name: string; scent?: string; quantity: number; price: number }>;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingAddress?: {
    recipient: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  } | null;
}

export function buildOrderConfirmationEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const itemsRows = data.items.map((item) =>
    `<tr>
      <td style="padding:8px 0;font-size:14px;color:#2d1f0e;">${item.name}${item.scent ? ` <span style="color:#8a7b6e;">(${item.scent})</span>` : ''}</td>
      <td style="padding:8px 0;font-size:14px;color:#8a7b6e;text-align:center;">×${item.quantity}</td>
      <td style="padding:8px 0;font-size:14px;color:#2d1f0e;text-align:right;">R${(item.price / 100).toFixed(2)}</td>
    </tr>`
  ).join('');

  const addressBlock = data.shippingAddress ? `
    ${divider()}
    <h3 style="margin:0 0 10px;font-size:14px;font-weight:600;color:#2d1f0e;">Delivery address</h3>
    <p style="margin:0;font-size:13px;color:#5c4a38;line-height:1.6;font-style:normal;">
      ${data.shippingAddress.recipient}<br/>
      ${data.shippingAddress.addressLine1}${data.shippingAddress.addressLine2 ? `, ${data.shippingAddress.addressLine2}` : ''}<br/>
      ${data.shippingAddress.city}, ${data.shippingAddress.province} ${data.shippingAddress.postalCode}<br/>
      ${data.shippingAddress.country}
    </p>` : '';

  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#2d1f0e;">Order confirmed 🕯️</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8a7b6e;">Hi ${data.customerName || 'there'}, thank you for your order. We&rsquo;ll send you another email when it ships.</p>
    <p style="margin:0 0 16px;font-size:13px;color:#8a7b6e;">Order ID: <span style="font-family:monospace;color:#5c4a38;">${data.orderId.slice(0, 8).toUpperCase()}</span></p>
    ${divider()}
    <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#2d1f0e;">Your items</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsRows}
    </table>
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-size:13px;color:#8a7b6e;padding:4px 0;">Subtotal</td>
        <td style="font-size:13px;color:#8a7b6e;text-align:right;padding:4px 0;">R${(data.subtotalCents / 100).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#8a7b6e;padding:4px 0;">Shipping</td>
        <td style="font-size:13px;color:#8a7b6e;text-align:right;padding:4px 0;">${data.shippingCents === 0 ? 'Free' : `R${(data.shippingCents / 100).toFixed(2)}`}</td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:700;color:#2d1f0e;padding-top:8px;">Total</td>
        <td style="font-size:15px;font-weight:700;color:#2d1f0e;text-align:right;padding-top:8px;">R${(data.totalCents / 100).toFixed(2)}</td>
      </tr>
    </table>
    ${addressBlock}
    ${divider()}
    <div style="text-align:center;margin-top:8px;">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#1a1208;color:#f9f6f2;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;letter-spacing:0.5px;">View order</a>
    </div>
  `;

  const text = `Order confirmed!\n\nHi ${data.customerName || 'there'}, thank you for your order.\nOrder ID: ${data.orderId.slice(0, 8).toUpperCase()}\n\nItems:\n${data.items.map((i) => `- ${i.name}${i.scent ? ` (${i.scent})` : ''} ×${i.quantity} — R${(i.price / 100).toFixed(2)}`).join('\n')}\n\nTotal: R${(data.totalCents / 100).toFixed(2)}\n\nView your order: ${BASE_URL}/dashboard`;

  return { subject: 'Your Lusso order is confirmed 🕯️', html: layout('Order Confirmed — Lusso', body), text };
}

// ─── Dispatch / Shipped ────────────────────────────────────────────────────────

export interface DispatchEmailData {
  orderId: string;
  customerName: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  fulfillmentStatus: 'SHIPPED' | 'DELIVERED';
}

export function buildDispatchEmail(data: DispatchEmailData): { subject: string; html: string; text: string } {
  const isDelivered = data.fulfillmentStatus === 'DELIVERED';
  const trackingBlock = data.trackingNumber ? `
    ${divider()}
    <p style="font-size:14px;color:#2d1f0e;margin:0 0 4px;"><strong>Carrier:</strong> ${data.carrier ?? 'Standard courier'}</p>
    <p style="font-size:14px;color:#2d1f0e;margin:0;"><strong>Tracking number:</strong> <span style="font-family:monospace;">${data.trackingNumber}</span></p>` : '';

  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#2d1f0e;">${isDelivered ? 'Order delivered 🎉' : 'Your order is on its way 📦'}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8a7b6e;">Hi ${data.customerName || 'there'}, ${isDelivered ? 'your Lusso order has been delivered.' : 'your order has been dispatched and is heading your way.'}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#8a7b6e;">Order ID: <span style="font-family:monospace;color:#5c4a38;">${data.orderId.slice(0, 8).toUpperCase()}</span></p>
    ${trackingBlock}
    ${divider()}
    <div style="text-align:center;margin-top:8px;">
      <a href="${BASE_URL}/dashboard" style="display:inline-block;background:#1a1208;color:#f9f6f2;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">View order</a>
    </div>
  `;

  const subject = isDelivered ? 'Your Lusso order has been delivered' : 'Your Lusso order has shipped 📦';
  const text = `${subject}\n\nHi ${data.customerName || 'there'},\n${isDelivered ? 'Your order has been delivered.' : 'Your order is on its way.'}\n\nOrder ID: ${data.orderId.slice(0, 8).toUpperCase()}${data.trackingNumber ? `\nCarrier: ${data.carrier ?? 'Standard courier'}\nTracking: ${data.trackingNumber}` : ''}\n\nView order: ${BASE_URL}/dashboard`;

  return { subject, html: layout(subject, body), text };
}

// ─── Payment Failed ────────────────────────────────────────────────────────────

export function buildPaymentFailedEmail(data: { orderId: string; customerName: string }): { subject: string; html: string; text: string } {
  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#2d1f0e;">Payment unsuccessful</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8a7b6e;">Hi ${data.customerName || 'there'}, unfortunately we couldn&rsquo;t process your payment for order <span style="font-family:monospace;color:#5c4a38;">${data.orderId.slice(0, 8).toUpperCase()}</span>.</p>
    <p style="font-size:14px;color:#5c4a38;">Your cart items are still saved. Return to your cart and try again — or contact us if you need help.</p>
    ${divider()}
    <div style="text-align:center;margin-top:8px;">
      <a href="${BASE_URL}/cart" style="display:inline-block;background:#1a1208;color:#f9f6f2;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Return to cart</a>
    </div>
  `;
  const subject = 'Payment unsuccessful — Lusso';
  const text = `${subject}\n\nHi ${data.customerName || 'there'}, your payment for order ${data.orderId.slice(0, 8).toUpperCase()} was unsuccessful. Return to your cart and try again: ${BASE_URL}/cart`;
  return { subject, html: layout(subject, body), text };
}

// ─── Password Reset ────────────────────────────────────────────────────────────

export function buildPasswordResetEmail(data: { resetUrl: string }): { subject: string; html: string; text: string } {
  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#2d1f0e;">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8a7b6e;">We received a request to reset your Lusso account password. Click the button below — this link expires in 1 hour.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${data.resetUrl}" style="display:inline-block;background:#1a1208;color:#f9f6f2;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">Reset password</a>
    </div>
    <p style="font-size:12px;color:#b0a090;text-align:center;">If you didn&rsquo;t request a reset, you can safely ignore this email.</p>
  `;
  const subject = 'Reset your Lusso password';
  const text = `${subject}\n\nReset link (expires in 1 hour): ${data.resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html: layout(subject, body), text };
}
