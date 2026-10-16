import { createHmac } from 'crypto';

// ─── Peach Orchestration endpoints ───────────────────────────────────────────
// Sandbox:  auth  → https://sandbox-dashboard.peachpayments.com
//           checkout → https://sandbox-checkout.peachpayments.com
// Live:     auth  → https://dashboard.peachpayments.com
//           checkout → https://secure.peachpayments.com

const PEACH_AUTH_URL =
  process.env.PEACH_AUTH_URL || 'https://sandbox-dashboard.peachpayments.com';
const PEACH_CHECKOUT_URL =
  process.env.PEACH_CHECKOUT_URL || 'https://sandbox-checkout.peachpayments.com';

// OAuth credentials (from Peach Dashboard → Checkout → API keys)
const PEACH_CLIENT_ID = process.env.PEACH_CLIENT_ID!;
const PEACH_CLIENT_SECRET = process.env.PEACH_CLIENT_SECRET!;
const PEACH_MERCHANT_ID = process.env.PEACH_MERCHANT_ID!;
const PEACH_ENTITY_ID = process.env.PEACH_ENTITY_ID!;

// Webhook signing secret (Peach Dashboard → Checkout → Webhook secret)
const PEACH_WEBHOOK_SECRET = process.env.PEACH_WEBHOOK_SECRET || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateCheckoutParams {
  /** Decimal string, e.g. "349.00" */
  amount: string;
  currency: string;
  /** Full UUID — must match the value stored in the Order record */
  merchantTransactionId: string;
  shopperResultUrl: string;
}

interface PeachCheckoutResponse {
  checkoutId: string;
  redirectUrl?: string;
}

// ─── OAuth token fetch ────────────────────────────────────────────────────────

/**
 * Obtains a short-lived Bearer token from the Peach Authentication service.
 * Tokens are valid for a limited time; a fresh one is fetched per checkout
 * creation (no caching) to keep things simple and correct.
 */
async function fetchAccessToken(): Promise<string> {
  const response = await fetch(`${PEACH_AUTH_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: PEACH_CLIENT_ID,
      clientSecret: PEACH_CLIENT_SECRET,
      merchantId: PEACH_MERCHANT_ID,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Peach auth failed (${response.status}): ${text}`
    );
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(
      `Peach auth returned no access_token: ${JSON.stringify(data)}`
    );
  }

  return data.access_token as string;
}

// ─── Checkout creation ────────────────────────────────────────────────────────

/**
 * Creates a Peach Orchestration v2 checkout instance.
 * Returns the checkoutId which the client-side SDK uses to render the
 * Embedded Checkout form.
 *
 * Docs: https://developer.peachpayments.com/docs/checkout-embedded-tutorial
 */
export async function createCheckoutId(
  params: CreateCheckoutParams
): Promise<string> {
  const accessToken = await fetchAccessToken();

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const body = {
    authentication: {
      entityId: PEACH_ENTITY_ID,
    },
    // merchantTransactionId must be stored as-is in the Order record so the
    // webhook lookup works. Do NOT truncate here.
    merchantTransactionId: params.merchantTransactionId,
    amount: params.amount,
    currency: params.currency,
    paymentType: 'DB',
    // Each checkout creation requires a unique nonce.
    nonce: crypto.randomUUID(),
    shopperResultUrl: params.shopperResultUrl,
  };

  const response = await fetch(`${PEACH_CHECKOUT_URL}/v2/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      // Peach requires Origin for domain allowlist verification
      Origin: baseUrl,
      Referer: baseUrl,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Peach /v2/checkout failed (${response.status}): ${text}`
    );
  }

  const data: PeachCheckoutResponse = await response.json();

  if (!data.checkoutId) {
    throw new Error(
      `Peach /v2/checkout returned no checkoutId: ${JSON.stringify(data)}`
    );
  }

  return data.checkoutId;
}

// ─── Webhook signature validation ─────────────────────────────────────────────

/**
 * Validates the HMAC-SHA256 signature that Peach Payments attaches to
 * webhook POST requests and shopper-result-URL redirects.
 *
 * The signature covers all query/body parameters sorted alphabetically,
 * concatenated as key=value pairs, signed with the secret token.
 *
 * Returns true if the signature is valid (or if no secret is configured —
 * set PEACH_WEBHOOK_SECRET in production to enforce validation).
 */
export function validateWebhookSignature(
  payload: string,
  receivedSignature: string
): boolean {
  if (!PEACH_WEBHOOK_SECRET) {
    console.warn(
      '[Peach] PEACH_WEBHOOK_SECRET is not set — webhook signature validation is disabled. ' +
        'Set this variable in production to prevent spoofed webhook calls.'
    );
    return true;
  }

  const expected = createHmac('sha256', PEACH_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  if (expected.length !== receivedSignature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}
