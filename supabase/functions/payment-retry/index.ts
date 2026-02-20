/**
 * Payment Retry – Edge Function
 * For an existing order (pending payment), creates a new payment row and triggers M-Pesa STK Push.
 * Does NOT create a new order. Call this when user taps "Retry Payment" on the payment status screen.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  return cleaned;
}

type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  env: 'sandbox' | 'production';
};

type StkPushRequest = { phone: string; amount: number; reference: string; description: string };
type StkPushResponse = { success: boolean; checkoutRequestID?: string; merchantRequestID?: string; errorCode?: string; errorMessage?: string };

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PROD_URL = 'https://api.safaricom.co.ke';

async function getMpesaAccessToken(config: MpesaConfig): Promise<string> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);
  const res = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

async function mpesaStkPush(config: MpesaConfig, token: string, req: StkPushRequest): Promise<StkPushResponse> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  const phone = req.phone.replace(/\D/g, '');
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = btoa(`${config.shortcode}${config.passkey}${timestamp}`);
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
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const supabase = getServiceClient();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', code: 'INVALID_TOKEN' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'order_id required', code: 'MISSING_ORDER_ID' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Load order – must belong to current user and be pending (payment not completed)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, user_id, status, total_tzs, shipping_address')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found', code: 'ORDER_NOT_FOUND' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (order.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Order is already paid or cancelled', code: 'ORDER_NOT_PENDING' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const shipping = (order.shipping_address as any) || {};
    const phone = shipping.phone || '';
    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) {
      return new Response(JSON.stringify({ error: 'Phone number required for payment', code: 'MISSING_PHONE' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const amountTzs = Number(order.total_tzs);
    if (amountTzs <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid order total', code: 'INVALID_AMOUNT' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Create new payment for this order
    const idempotencyKey = `retry-${orderId}-${Date.now()}`;
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        provider: 'mpesa',
        status: 'initiated',
        amount_tzs: amountTzs,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: 'Failed to create payment', code: 'PAYMENT_CREATE_FAILED' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (consumerKey && consumerSecret && shortcode && passkey) {
      const env = (Deno.env.get('MPESA_ENV') as 'sandbox' | 'production') || 'sandbox';
      const token = await getMpesaAccessToken({ consumerKey, consumerSecret, shortcode, passkey, env });
      const stk = await mpesaStkPush(
        { consumerKey, consumerSecret, shortcode, passkey, env },
        token,
        {
          phone: phoneNormalized.startsWith('255') ? phoneNormalized : `255${phoneNormalized}`,
          amount: amountTzs,
          reference: order.id,
          description: `WATS #${order.order_number}`,
        }
      );
      if (stk.checkoutRequestID) {
        await supabase.from('payments').update({ provider_reference: stk.checkoutRequestID }).eq('id', payment.id);
      }
      if (!stk.success) {
        await supabase
          .from('payments')
          .update({ status: 'failed', provider_callback: { error: stk.errorMessage, errorCode: stk.errorCode } })
          .eq('id', payment.id);
        return new Response(
          JSON.stringify({
            order_id: order.id,
            order_number: order.order_number,
            payment_id: payment.id,
            stk_push_failed: true,
            error: stk.errorMessage || 'Failed to send M-Pesa payment request',
            code: 'STK_PUSH_FAILED',
            message: 'Payment request failed. Please check your phone number and try again.',
          }),
          { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        payment_id: payment.id,
        status: 'initiated',
        message: 'Payment request sent. Complete payment on your phone.',
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), code: 'INTERNAL_ERROR' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
