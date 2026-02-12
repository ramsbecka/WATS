/**
 * M-Pesa (Tanzania) adapter for STK Push / Pay Bill
 * Uses Daraja API. Replace with your provider's SDK in production.
 */

export type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  env: 'sandbox' | 'production';
};

export type StkPushRequest = {
  phone: string;      // 255712345678
  amount: number;     // TZS
  reference: string;  // order_id or idempotency_key
  description: string;
};

export type StkPushResponse = {
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  errorCode?: string;
  errorMessage?: string;
};

// M-Pesa API URLs
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PROD_URL = 'https://api.safaricom.co.ke';

export async function getMpesaAccessToken(config: MpesaConfig): Promise<string> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa auth failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.access_token;
}

export async function mpesaStkPush(
  config: MpesaConfig,
  token: string,
  req: StkPushRequest
): Promise<StkPushResponse> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  const phone = req.phone.replace(/\D/g, '');
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');

  const body = {
    BusinessShortCode: config.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(req.amount),
    PartyA: phone,
    PartyB: config.shortcode,
    PhoneNumber: phone,
    CallBackURL: Deno.env.get('MPESA_CALLBACK_URL') || '',
    AccountReference: req.reference.slice(0, 12),
    TransactionDesc: req.description.slice(0, 20),
  };

  const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const success = res.ok && data.ResponseCode === '0';
  return {
    success,
    checkoutRequestID: data.CheckoutRequestID,
    merchantRequestID: data.MerchantRequestID,
    errorCode: data.errorCode || data.ResponseCode,
    errorMessage: data.errorMessage || data.ResponseDescription,
  };
}

/**
 * Verify M-Pesa callback signature (if provider sends one)
 * Tanzanian Daraja may use different signing - adapt as needed.
 */
export async function verifyMpesaWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return signature === expected || signature === `sha256=${expected}`;
}
