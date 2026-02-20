/**
 * Checkout Initiate – Edge Function
 * Validates cart, creates order + payment, triggers STK Push (M-Pesa).
 * Idempotency via idempotency_key.
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inline getServiceClient to avoid bundling issues with _shared folder
function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

// Inline validation helpers
interface ShippingAddress {
  name?: string;
  phone?: string;
  region?: string;
  district?: string;
  ward?: string;
  street?: string;
}

function validateShippingAddress(addr: ShippingAddress | null | undefined): { valid: boolean; error?: string } {
  if (!addr || typeof addr !== 'object') {
    return { valid: false, error: 'Invalid shipping_address' };
  }
  const phone = addr.phone?.trim();
  const region = addr.region?.trim();
  const street = addr.street?.trim();
  if (!phone) return { valid: false, error: 'Phone required' };
  if (!region) return { valid: false, error: 'Region required' };
  if (!street) return { valid: false, error: 'Street required' };
  return { valid: true };
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Remove leading 0 if present (Tanzania phone numbers start with 0)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

// Inline M-Pesa types and functions
type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  env: 'sandbox' | 'production';
};

type StkPushRequest = {
  phone: string;      // 255712345678
  amount: number;     // TZS
  reference: string;  // order_id or idempotency_key
  description: string;
};

type StkPushResponse = {
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  errorCode?: string;
  errorMessage?: string;
};

// M-Pesa API URLs
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PROD_URL = 'https://api.safaricom.co.ke';

async function getMpesaAccessToken(config: MpesaConfig): Promise<string> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  // Use Deno-compatible base64 encoding instead of Buffer
  const credentials = `${config.consumerKey}:${config.consumerSecret}`;
  const auth = btoa(credentials);
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

async function mpesaStkPush(
  config: MpesaConfig,
  token: string,
  req: StkPushRequest
): Promise<StkPushResponse> {
  const base = config.env === 'sandbox' ? SANDBOX_URL : PROD_URL;
  const phone = req.phone.replace(/\D/g, '');
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  // Use Deno-compatible base64 encoding instead of Buffer
  const passwordString = `${config.shortcode}${config.passkey}${timestamp}`;
  const password = btoa(passwordString);

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

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

interface CheckoutBody {
  shipping_address: {
    name: string;
    phone: string;
    region: string;
    district: string;
    ward?: string;
    street: string;
  };
  idempotency_key?: string;
  payment_provider?: 'mpesa' | 'airtel_money' | 'mixx' | 'halopesa';
  voucher_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const supabase = getServiceClient();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Read request body once
    const body: CheckoutBody = await req.json();
    
    // Get idempotency key from header or body
    const idempotencyKey = req.headers.get('x-idempotency-key') || body.idempotency_key;
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'idempotency_key required', code: 'MISSING_IDEMPOTENCY' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    const { shipping_address, payment_provider = 'mpesa', voucher_code } = body;
    const validation = validateShippingAddress(shipping_address);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid shipping_address', code: 'INVALID_ADDRESS' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency: return existing order if already processed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('idempotency_key', idempotencyKey)
      .single();
    if (existingOrder) {
      return new Response(
        JSON.stringify({
          order_id: existingOrder.id,
          order_number: existingOrder.order_number,
          status: existingOrder.status,
          idempotent: true,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile (phone for payment) – table is profile (watumiaji), not profiles
    const { data: profile } = await supabase.from('profile').select('phone').eq('id', user.id).single();
    const phone = profile?.phone || shipping_address!.phone;
    const phoneNormalized = normalizePhone(phone || '');
    if (!phoneNormalized) {
      return new Response(
        JSON.stringify({ error: 'Phone number required for payment', code: 'MISSING_PHONE' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Get cart
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
    if (!cart) {
      return new Response(
        JSON.stringify({ error: 'Cart not found', code: 'CART_NOT_FOUND' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        product_id,
        quantity,
        variant_id,
        products ( id, price_tzs, vendor_id, name_sw ),
        product_variants ( price_tzs )
      `)
      .eq('cart_id', cart.id);
    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty', code: 'CART_EMPTY' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let subtotal = 0;
    const orderItems: { product_id: string; vendor_id: string; quantity: number; unit_price_tzs: number; total_tzs: number; variant_id: string | null }[] = [];
    for (const row of items as any[]) {
      const product = row.products;
      if (!product) continue;
      const qty = row.quantity;
      const variantPrice = row.product_variants?.price_tzs != null ? Number(row.product_variants.price_tzs) : null;
      const unitPrice = variantPrice ?? Number(product.price_tzs);
      const total = unitPrice * qty;
      subtotal += total;
      orderItems.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        quantity: qty,
        unit_price_tzs: unitPrice,
        total_tzs: total,
        variant_id: row.variant_id ?? null,
      });
    }
    
    // Apply voucher discount if provided
    let voucherDiscount = 0;
    let voucherId: string | null = null;
    if (voucher_code) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('id, user_id, discount_percentage, discount_amount_tzs, min_order_amount_tzs, max_discount_amount_tzs, usage_count, max_usage')
        .eq('code', voucher_code.toUpperCase().trim())
        .eq('user_id', user.id)
        .eq('is_used', false)
        .gte('valid_until', new Date().toISOString())
        .single();
      
      if (voucher && subtotal >= Number(voucher.min_order_amount_tzs || 0)) {
        if (voucher.usage_count < voucher.max_usage) {
          voucherId = voucher.id;
          if (voucher.discount_percentage) {
            voucherDiscount = (subtotal * Number(voucher.discount_percentage)) / 100;
            if (voucher.max_discount_amount_tzs) {
              voucherDiscount = Math.min(voucherDiscount, Number(voucher.max_discount_amount_tzs));
            }
          } else if (voucher.discount_amount_tzs) {
            voucherDiscount = Number(voucher.discount_amount_tzs);
          }
        }
      }
    }
    
    const shippingTzs = 0; // TODO: calculate from region
    const taxTzs = 0;
    const totalTzs = Math.max(0, subtotal - voucherDiscount + shippingTzs + taxTzs);

    // Create order (order_number from trigger)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal_tzs: subtotal,
        shipping_tzs: shippingTzs,
        tax_tzs: taxTzs,
        total_tzs: totalTzs,
        shipping_address: shipping_address,
        idempotency_key: idempotencyKey,
        voucher_id: voucherId,
      })
      .select('id, order_number')
      .single();
    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderErr?.message, code: 'ORDER_CREATE_FAILED' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Order items (include variant_id so admin and mobile see correct line item)
    await supabase.from('order_items').insert(
      orderItems.map((oi) => ({
        order_id: order.id,
        product_id: oi.product_id,
        vendor_id: oi.vendor_id,
        quantity: oi.quantity,
        unit_price_tzs: oi.unit_price_tzs,
        total_tzs: oi.total_tzs,
        variant_id: oi.variant_id || null,
      }))
    );

    // Note: Voucher will be marked as used automatically via trigger when payment completes

    // Create payment record
    const { data: payment, error: payInsertErr } = await supabase
      .from('payments')
      .insert({
        order_id: order.id,
        provider: payment_provider,
        status: 'initiated',
        amount_tzs: totalTzs,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();
    if (payInsertErr || !payment) {
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', code: 'PAYMENT_CREATE_FAILED' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // M-Pesa STK Push (example)
    if (payment_provider === 'mpesa') {
      const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
      const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
      const shortcode = Deno.env.get('MPESA_SHORTCODE');
      const passkey = Deno.env.get('MPESA_PASSKEY');
      if (consumerKey && consumerSecret && shortcode && passkey) {
        const env = (Deno.env.get('MPESA_ENV') as 'sandbox' | 'production') || 'sandbox';
        const token = await getMpesaAccessToken({
          consumerKey,
          consumerSecret,
          shortcode,
          passkey,
          env,
        });
        const stk = await mpesaStkPush(
          { consumerKey, consumerSecret, shortcode, passkey, env },
          token,
          {
            phone: phoneNormalized.startsWith('255') ? phoneNormalized : `255${phoneNormalized}`,
            amount: totalTzs,
            reference: order.id,
            description: `WATS #${order.order_number}`,
          }
        );
        if (stk.checkoutRequestID) {
          await supabase
            .from('payments')
            .update({ provider_reference: stk.checkoutRequestID })
            .eq('id', payment.id);
        }
        if (!stk.success) {
          // Update payment status to failed
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
              error_code: stk.errorCode,
              code: 'STK_PUSH_FAILED',
              message: 'Payment request failed. Please check your phone number and try again.',
            }),
            { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Clear cart
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
        payment_id: payment.id,
        status: 'pending',
        message: 'Order created. Complete payment on your phone.',
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e), code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
