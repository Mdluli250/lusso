import { createHmac } from 'crypto';

const PEACH_BASE_URL = process.env.PEACH_BASE_URL!;
const PEACH_ACCESS_TOKEN = process.env.PEACH_ACCESS_TOKEN!;
const PEACH_ENTITY_ID = process.env.PEACH_ENTITY_ID!;
const PEACH_WEBHOOK_SECRET = process.env.PEACH_WEBHOOK_SECRET!;

interface CreateCheckoutIdParams {
  amount: string; // e.g. "349.00"
  currency: string; // "ZAR"
  merchantTransactionId: string;
  shopperResultUrl: string;
}

/**
 * Creates a checkout ID by calling the Peach Payments API.
 * Returns the checkoutId string on success, throws on failure.
 */
export async function createCheckoutId(
  params: CreateCheckoutIdParams
): Promise<string> {
  const body = new URLSearchParams({
    entityId: PEACH_ENTITY_ID,
    amount: params.amount,
    currency: params.currency,
    paymentType: 'DB',
    merchantTransactionId: params.merchantTransactionId,
    shopperResultUrl: params.shopperResultUrl,
  });

  const response = await fetch(`${PEACH_BASE_URL}/v1/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PEACH_ACCESS_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Peach Payments API error (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();

  if (!data.id) {
    throw new Error(
      `Peach Payments API did not return a checkoutId: ${JSON.stringify(data)}`
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
  const expectedSignature = createHmac('sha256', PEACH_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return expectedSignature === receivedSignature;
}
