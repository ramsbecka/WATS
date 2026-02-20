/**
 * Bulk upload products for a store – Edge Function
 * POST body: { vendor_id: uuid, products: [...] }
 * Admin only: admin uploads products on behalf of the store.
 */

import { getServiceClient, getAuthClient } from '../_shared/db.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductInput {
  sku?: string;
  name_sw: string;
  name_en?: string;
  description_sw?: string;
  description_en?: string;
  price_tzs: number;
  category_id?: string;
  images?: string[];
}

interface Body {
  vendor_id: string;
  products: ProductInput[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = getAuthClient(req);
    const { data: { user }, error: userError } = await authClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', code: 'INVALID_BODY' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { vendor_id: vendorId, products: productsInput } = body;
    if (!vendorId || !Array.isArray(productsInput) || productsInput.length === 0) {
      return new Response(
        JSON.stringify({ error: 'vendor_id and non-empty products array required', code: 'VALIDATION' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getServiceClient();
    const { data: adminRow } = await supabase.from('admin_profile').select('id').eq('id', user.id).maybeSingle();
    const isAdmin = !!adminRow?.id;

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin only', code: 'FORBIDDEN' }),
        { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const ids: string[] = [];
    for (const p of productsInput) {
      if (!p.name_sw || typeof p.price_tzs !== 'number' || p.price_tzs < 0) continue;
      const { data: product, error: insertErr } = await supabase
        .from('products')
        .insert({
          vendor_id: vendorId,
          category_id: p.category_id || null,
          sku: p.sku || null,
          name_sw: p.name_sw,
          name_en: p.name_en || null,
          description_sw: p.description_sw || null,
          description_en: p.description_en || null,
          price_tzs: p.price_tzs,
          is_active: true,
        })
        .select('id')
        .single();

      if (insertErr) continue;
      const productId = (product as { id: string }).id;
      ids.push(productId);

      const urls = Array.isArray(p.images) ? p.images : [];
      for (let i = 0; i < urls.length; i++) {
        const url = typeof urls[i] === 'string' ? urls[i] : null;
        if (url) {
          await supabase.from('product_images').insert({
            product_id: productId,
            url,
            sort_order: i,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ created: ids.length, ids }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Internal error', code: 'INTERNAL' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
