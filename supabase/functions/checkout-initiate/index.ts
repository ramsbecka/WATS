/**
 * Checkout Initiate – Edge Function
 * Validates cart, creates order + payment, triggers STK Push (M-Pesa).
 * Idempotency via idempotency_key.
 */

import { getServiceClient } from '../_shared/db.ts';
import { validateShippingAddress, normalizePhone } from '../_shared/checkout_validation.ts';
import { getMpesaAccessToken, mpesaStkPush } from '../_shared/providers/mpesa.ts';

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

    const idempotencyKey = req.headers.get('x-idempotency-key') || (await req.json().then((b: CheckoutBody) => b.idempotency_key));
    if (!idempotencyKey) {
      return new Response(
        JSON.stringify({ error: 'idempotency_key required', code: 'MISSING_IDEMPOTENCY' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const body: CheckoutBody = await req.json();
    const { shipping_address, payment_provider = 'mpesa' } = body;
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

    // Get profile (phone for payment)
    const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
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
        products ( id, price_tzs, vendor_id, name_sw )
      `)
      .eq('cart_id', cart.id);
    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty', code: 'CART_EMPTY' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let subtotal = 0;
    const orderItems: { product_id: string; vendor_id: string; quantity: number; unit_price_tzs: number; total_tzs: number }[] = [];
    for (const row of items as any[]) {
      const product = row.products;
      if (!product) continue;
      const qty = row.quantity;
      const unitPrice = Number(product.price_tzs);
      const total = unitPrice * qty;
      subtotal += total;
      orderItems.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        quantity: qty,
        unit_price_tzs: unitPrice,
        total_tzs: total,
      });
    }
    const shippingTzs = 0; // TODO: calculate from region
    const taxTzs = 0;
    const totalTzs = subtotal + shippingTzs + taxTzs;

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
      })
      .select('id, order_number')
      .single();
    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderErr?.message, code: 'ORDER_CREATE_FAILED' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Order items
    await supabase.from('order_items').insert(
      orderItems.map((oi) => ({
        order_id: order.id,
        product_id: oi.product_id,
        vendor_id: oi.vendor_id,
        quantity: oi.quantity,
        unit_price_tzs: oi.unit_price_tzs,
        total_tzs: oi.total_tzs,
      }))
    );

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
        const token = await getMpesaAccessToken({
          consumerKey,
          consumerSecret,
          shortcode,
          passkey,
          env: (Deno.env.get('MPESA_ENV') as 'sandbox' | 'production') || 'sandbox',
        });
        const stk = await mpesaStkPush(
          { consumerKey, consumerSecret, shortcode, passkey, env: 'sandbox' },
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
          return new Response(
            JSON.stringify({
              order_id: order.id,
              order_number: order.order_number,
              payment_id: payment.id,
              stk_push_failed: true,
              error: stk.errorMessage,
              code: 'STK_PUSH_FAILED',
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
