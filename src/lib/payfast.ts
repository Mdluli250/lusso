import { createHash } from 'crypto';
import dns from 'dns/promises';

// ─── PayFast endpoints ────────────────────────────────────────────────────────
// Sandbox: https://sandbox.payfast.co.za
// Live:    https://www.payfast.co.za

const PAYFAST_HOST =
  process.env.PAYFAST_HOST || 'sandbox.payfast.co.za';

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!;

/**
 * Passphrase (salt) set in the PayFast merchant dashboard → Settings.
 * Required for subscriptions/tokenization and strongly recommended for all
 * transactions. Leave empty only if your account has no passphrase set.
 */
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayFastPaymentData {
  /** Unique payment ID on the merchant's system (max 100 chars) */
  m_payment_id: string;
  /** Amount in ZAR, formatted as a decimal string e.g. "349.00" */
  amount: string;
  /** Item name (max 100 chars) */
  item_name: string;
  /** URL to redirect the shopper on successful payment */
  return_url: string;
  /** URL to redirect the shopper if they cancel */
  cancel_url: string;
  /** URL PayFast POSTs the ITN to */
  notify_url: string;
  /** Customer first name (optional, max 100 chars) */
  name_first?: string;
  /** Customer last name (optional, max 100 chars) */
  name_last?: string;
  /** Customer email address (required for Onsite, optional for redirect) */
  email_address?: string;
}

// ─── Signature generation ─────────────────────────────────────────────────────

/**
 * Generates the MD5 signature required by PayFast.
 *
 * Rules:
 * - Pairs must appear in the same order as the PayFast docs (i.e. the order
 *   of the keys in `data`, NOT alphabetical).
 * - Empty values are excluded.
 * - Values are percent-encoded; spaces become '+'.
 * - If a passphrase is set it is appended as `&passphrase=<encoded>`.
 *
 * @see https://developers.payfast.co.za/docs#step-2
 */
export function generateSignature(
  data: Record<string, string>,
  passPhrase: string = PAYFAST_PASSPHRASE
): string {
  let pfOutput = '';
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove trailing ampersand
  let paramString = pfOutput.slice(0, -1);

  if (passPhrase) {
    paramString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  return createHash('md5').update(paramString).digest('hex');
}

// ─── Onsite UUID generation ───────────────────────────────────────────────────

/**
 * Builds the URL-encoded POST body and fetches a one-time UUID from the
 * PayFast Onsite Payments endpoint.
 *
 * The UUID is then passed to `window.payfast_do_onsite_payment()` on the
 * client to trigger the hosted payment modal without a page redirect.
 *
 * @see https://developers.payfast.co.za/docs#onsite-payments
 */
export async function generatePayFastUUID(
  paymentData: PayFastPaymentData
): Promise<string> {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    throw new Error(
      'PayFast is not configured. Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY in your .env file.'
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const data: Record<string, string> = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: paymentData.return_url,
    cancel_url: paymentData.cancel_url,
    notify_url: paymentData.notify_url,
    ...(paymentData.name_first ? { name_first: paymentData.name_first } : {}),
    ...(paymentData.name_last ? { name_last: paymentData.name_last } : {}),
    ...(paymentData.email_address ? { email_address: paymentData.email_address } : {}),
    m_payment_id: paymentData.m_payment_id,
    amount: paymentData.amount,
    item_name: paymentData.item_name,
  };

  // Signature must be appended last and is not included in its own hash input
  data['signature'] = generateSignature(data);

  let pfParamString = '';
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      pfParamString += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }
  pfParamString = pfParamString.slice(0, -1);

  const response = await fetch(
    `https://${PAYFAST_HOST}/onsite/process`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': String(Buffer.byteLength(pfParamString)),
        // PayFast requires a Referer header when using the Onsite API
        Referer: baseUrl,
      },
      body: pfParamString,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PayFast /onsite/process failed (${response.status}): ${text}`
    );
  }

  const json = (await response.json()) as { uuid?: string };

  if (!json.uuid) {
    throw new Error(
      `PayFast /onsite/process returned no uuid: ${JSON.stringify(json)}`
    );
  }

  return json.uuid;
}

// ─── ITN (Instant Transaction Notification) verification ─────────────────────

/**
 * Valid PayFast server hostnames.  We resolve each to IPs and check that
 * the incoming request originated from one of them.
 */
const VALID_PAYFAST_HOSTS = [
  'www.payfast.co.za',
  'sandbox.payfast.co.za',
  'w1w.payfast.co.za',
  'w2w.payfast.co.za',
];

/**
 * 1. Verify the MD5 signature on the ITN payload.
 */
export function validateITNSignature(
  pfData: Record<string, string>,
  passPhrase: string = PAYFAST_PASSPHRASE
): boolean {
  const received = pfData['signature'] ?? '';

  // Build param string from all fields EXCEPT signature, in received order
  let pfParamString = '';
  for (const key in pfData) {
    if (
      Object.prototype.hasOwnProperty.call(pfData, key) &&
      key !== 'signature'
    ) {
      pfParamString += `${key}=${encodeURIComponent(pfData[key].trim()).replace(/%20/g, '+')}&`;
    }
  }
  pfParamString = pfParamString.slice(0, -1);

  let tempParamString = pfParamString;
  if (passPhrase) {
    tempParamString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`;
  }

  const expected = createHash('md5').update(tempParamString).digest('hex');
  return received === expected;
}

/**
 * 2. Verify the request IP resolves to a known PayFast domain.
 */
export async function validateITNSourceIP(ip: string): Promise<boolean> {
  let validIps: string[] = [];

  for (const host of VALID_PAYFAST_HOSTS) {
    try {
      const ips = await dns.resolve4(host);
      validIps = [...validIps, ...ips];
    } catch {
      // DNS failure for one host — continue checking the rest
    }
  }

  // Deduplicate
  validIps = [...new Set(validIps)];

  return validIps.includes(ip);
}

/**
 * 3. Verify the amount_gross matches the expected cart total (within R0.01).
 */
export function validateITNAmount(
  expectedAmountDecimal: string,
  pfData: Record<string, string>
): boolean {
  const gross = parseFloat(pfData['amount_gross'] ?? '0');
  const expected = parseFloat(expectedAmountDecimal);
  return Math.abs(expected - gross) <= 0.01;
}

/**
 * 4. Confirm the ITN data by posting it back to PayFast's validation endpoint.
 *    Returns true only if PayFast responds with "VALID".
 */
export async function confirmITNWithPayFast(
  pfParamString: string
): Promise<boolean> {
  const validationUrl = `https://${PAYFAST_HOST}/eng/query/validate`;

  const response = await fetch(validationUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': String(Buffer.byteLength(pfParamString)),
    },
    body: pfParamString,
  });

  const body = await response.text();
  return body.trim() === 'VALID';
}

/**
 * Builds the URL-encoded param string from ITN POST data (excluding signature)
 * for use in `confirmITNWithPayFast`.
 */
export function buildITNParamString(
  pfData: Record<string, string>
): string {
  let out = '';
  for (const key in pfData) {
    if (
      Object.prototype.hasOwnProperty.call(pfData, key) &&
      key !== 'signature'
    ) {
      out += `${key}=${encodeURIComponent(pfData[key].trim()).replace(/%20/g, '+')}&`;
    }
  }
  return out.slice(0, -1);
}
