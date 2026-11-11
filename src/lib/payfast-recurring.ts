import { createHash, randomUUID } from 'crypto';

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? '';
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? '';
const API_BASE = process.env.PAYFAST_API_BASE ?? 'https://api.payfast.co.za';

function signature(values: Record<string, string>): string {
  // Sort all merchant fields alphabetically, then append passphrase separately.
  // PayFast recurring API: passphrase is appended after the sorted param string,
  // NOT included in the sort. Including it in the sort produces an incorrect hash.
  const sorted = Object.entries(values)
    .filter(([, value]) => value !== '')
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, '+')}`)
    .join('&');
  const withPassphrase = PASSPHRASE ? `${sorted}&passphrase=${encodeURIComponent(PASSPHRASE.trim()).replace(/%20/g, '+')}` : sorted;
  return createHash('md5').update(withPassphrase).digest('hex');
}

async function apiRequest(path: string, method: 'POST' | 'GET', body?: Record<string, string>) {
  if (!MERCHANT_ID || !PASSPHRASE) throw new Error('PayFast recurring API requires PAYFAST_MERCHANT_ID and PAYFAST_PASSPHRASE.');
  const timestamp = new Date().toISOString().slice(0, 19);
  // Body contains the payload fields + timestamp only.
  const bodyFields = { ...(body ?? {}), timestamp };
  // Signature is computed over the body fields only — 'merchant-id' and 'version'
  // are HTTP headers, NOT included in the signature per the PayFast recurring API docs.
  const sig = signature(bodyFields);
  const headers: Record<string, string> = {
    'merchant-id': MERCHANT_ID,
    version: 'v1',
    timestamp,
    signature: sig,
    ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
  };
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(method === 'POST' ? { body: JSON.stringify(bodyFields) } : {}),
  });
  const json = await response.json() as {
    status?: string;
    data?: { response?: unknown; token?: string; message?: string };
    message?: string;
  };
  if (!response.ok || (json.status && json.status !== 'success') || json.data?.response === false) {
    throw new Error(json.data?.message ?? json.message ?? `PayFast API failed (${response.status})`);
  }
  return json;
}

export async function chargeSubscriptionToken(token: string, amountCents: number, description: string, paymentId = randomUUID()) {
  const result = await apiRequest(`/subscriptions/${encodeURIComponent(token)}/adhoc`, 'POST', {
    amount: String(amountCents),
    item_name: 'Lusso subscription delivery',
    item_description: description.slice(0, 255),
    itn: 'true',
    m_payment_id: paymentId,
  });
  return { paymentId, result };
}

export async function refundPayFastPayment(paymentId: string, amountCents: number, reason: string) {
  const query = await apiRequest(`/refunds/query/${encodeURIComponent(paymentId)}`, 'GET');
  const queryData = query.data as { response?: { status?: string; amount_available_for_refund?: number | string }; status?: string; amount_available_for_refund?: number | string } | undefined;
  const details = queryData?.response ?? queryData;
  const available = Number(details?.amount_available_for_refund);
  if (details?.status === 'NOT_AVAILABLE' || !Number.isFinite(available) || amountCents > available) {
    throw new Error('PayFast reports that this amount is not refundable.');
  }
  return apiRequest(`/refunds/${encodeURIComponent(paymentId)}`, 'POST', {
    amount: String(amountCents),
    reason: reason.slice(0, 255),
    notify_buyer: 'true',
    notify_merchant: 'false',
  });
}
