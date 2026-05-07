import { createHmac } from 'crypto';

// V2 API credentials
const PEACH_BASE_URL = process.env.PEACH_BASE_URL || 'https://testapi-v2.peachpayments.com';
const PEACH_USER_ID = process.env.PEACH_USER_ID!;
const PEACH_PASSWORD = process.env.PEACH_PASSWORD!;
const PEACH_ENTITY_ID = process.env.PEACH_ENTITY_ID!;
const PEACH_WEBHOOK_SECRET = process.env.PEACH_WEBHOOK_SECRET || '';

interface CreateCheckoutIdParams {
  amount: string; // e.g. "349.00"
  currency: string; // "ZAR"
  merchantTransactionId: string;
  shopperResultUrl: string;
}

/**
 * Creates a payment using the Peach Payments v2 API.
 * Uses PEACHEFT as the payment brand for EFT payments.
 * Returns the transaction ID on success, throws on failure.
 */
export async function createCheckoutId(
  params: CreateCheckoutIdParams
): Promise<string> {
  const body = {
    authentication: {
      userId: PEACH_USER_ID,
      password: PEACH_PASSWORD,
      entityId: PEACH_ENTITY_ID,
    },
    merchantTransactionId: params.merchantTransactionId.replace(/-/g, '').slice(0, 16),
    amount: params.amount,
    currency: params.currency,
    paymentBrand: 'PEACHEFT',
    paymentType: 'DB',
    shopperResultUrl: params.shopperResultUrl,
  };

  const response = await fetch(`${PEACH_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  // Check for success - codes starting with "000." indicate success
  if (data.result?.code && !data.result.code.startsWith('000.')) {
    throw new Error(
      `Peach Payments API error: ${data.result.code} - ${data.result.description}`
    );
  }

  if (!data.id) {
    throw new Error(
      `Peach Payments API did not return a transaction ID: ${JSON.stringify(data)}`
    );
  }

  return data.id;
}

/**
 * Validates the HMAC-SHA256 webhook signature from Peach Payments.
 * Returns true if the signature matches, false otherwise.
 */
export function validateWebhookSignature(
  payload: string,
  receivedSignature: string
): boolean {
  if (!PEACH_WEBHOOK_SECRET) return true; // Skip validation if no secret configured
  
  const expectedSignature = createHmac('sha256', PEACH_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return expectedSignature === receivedSignature;
}
