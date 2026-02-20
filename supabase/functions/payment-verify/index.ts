/**
 * Payment Verify – Edge Function
 * Returns payment status for a given payment_id. Caller must be authenticated;
 * payment is returned only if the user owns the order.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
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
    const paymentId = body.payment_id;
    if (!paymentId || typeof paymentId !== 'string') {
      return new Response(JSON.stringify({ error: 'payment_id required', code: 'MISSING_PAYMENT_ID' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .select('id, order_id, provider, status, amount_tzs, provider_reference, created_at, updated_at')
      .eq('id', paymentId)
      .single();

    if (payErr || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found', code: 'NOT_FOUND' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', payment.order_id)
      .single();

    if (!order || order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Payment not found', code: 'NOT_FOUND' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(payment), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), code: 'INTERNAL_ERROR' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
