/**
 * Payment Webhook – Edge Function
 * Receives provider callbacks (e.g. M-Pesa), verifies signature, updates payment + order.
 */

import { getServiceClient } from '../_shared/db.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provider-signature',
};

// M-Pesa callback body structure (Daraja)
interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: { Name: string; Value: string | number }[];
      };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const rawBody = await req.text();
  const signature = req.headers.get('x-provider-signature') || req.headers.get('signature') || '';

  // In production: verify signature (provider-specific)
  const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
  if (webhookSecret && signature) {
    // Example: HMAC-SHA256 of rawBody
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    if (signature !== expected && signature !== `sha256=${expected}`) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }

  let body: MpesaCallbackBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = getServiceClient();
  const stk = body.Body?.stkCallback;
  if (!stk) {
    // M-Pesa sends other callbacks too, accept them
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const checkoutRequestID = stk.CheckoutRequestID;
  const merchantRequestID = stk.MerchantRequestID;
  const resultCode = stk.ResultCode;
  const resultDesc = stk.ResultDesc;
  const success = resultCode === 0;

  // Find payment by provider_reference (CheckoutRequestID) or MerchantRequestID
  // Try CheckoutRequestID first, then MerchantRequestID
  let payment: any = null;
  let payErr: any = null;
  
  const { data: paymentByCheckout, error: err1 } = await supabase
    .from('payments')
    .select('id, order_id, status, provider_reference')
    .eq('provider_reference', checkoutRequestID)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (paymentByCheckout) {
    payment = paymentByCheckout;
  } else {
    const { data: paymentByMerchant, error: err2 } = await supabase
      .from('payments')
      .select('id, order_id, status, provider_reference')
      .eq('provider_reference', merchantRequestID)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (paymentByMerchant) {
      payment = paymentByMerchant;
    } else {
      payErr = err2 || err1;
    }
  }

  if (payErr || !payment) {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (payment.status === 'completed') {
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Already processed' }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Extract payment details from callback metadata
  let amount: number | null = null;
  let phoneNumber: string | null = null;
  let receiptNumber: string | null = null;
  
  if (success && stk.CallbackMetadata?.Item) {
    const items = stk.CallbackMetadata.Item;
    const amountItem = items.find((i: any) => i.Name === 'Amount');
    const phoneItem = items.find((i: any) => i.Name === 'PhoneNumber');
    const receiptItem = items.find((i: any) => i.Name === 'MpesaReceiptNumber');
    
    amount = amountItem?.Value ? Number(amountItem.Value) : null;
    phoneNumber = phoneItem?.Value ? String(phoneItem.Value) : null;
    receiptNumber = receiptItem?.Value ? String(receiptItem.Value) : null;
  }

  const callbackPayload = {
    ResultCode: resultCode,
    ResultDesc: resultDesc,
    MerchantRequestID: merchantRequestID,
    CheckoutRequestID: checkoutRequestID,
    CallbackMetadata: stk.CallbackMetadata,
    Amount: amount,
    PhoneNumber: phoneNumber,
    ReceiptNumber: receiptNumber,
    received_at: new Date().toISOString(),
  };

  // Update payment with callback data
  const updateData: any = {
    status: success ? 'completed' : 'failed',
    provider_callback: callbackPayload,
    updated_at: new Date().toISOString(),
  };
  
  // If payment succeeded, store receipt number
  if (success && receiptNumber) {
    updateData.provider_reference = receiptNumber; // Store M-Pesa receipt number
  }
  
  await supabase
    .from('payments')
    .update(updateData)
    .eq('id', payment.id);

  if (success) {
    await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', payment.order_id);

    // Create shipment record for fulfillment (admin updates status/tracking)
    const { data: existingShipment } = await supabase.from('shipments').select('id').eq('order_id', payment.order_id).limit(1).maybeSingle();
    if (!existingShipment) {
      await supabase.from('shipments').insert({ order_id: payment.order_id, status: 'pending' });
    }

    // Notify user (insert notification)
    const { data: order } = await supabase.from('orders').select('user_id').eq('id', payment.order_id).single();
    if (order?.user_id) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Malipo yamefanikiwa',
        body: 'Order yako imethibitishwa.',
        data: { type: 'order_confirmed', order_id: payment.order_id },
      });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_completed',
      resource_type: 'payments',
      resource_id: payment.id,
      payload: { order_id: payment.order_id, provider_ref: checkoutRequestID },
    });
  }

  return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
