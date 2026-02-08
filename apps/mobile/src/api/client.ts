import { supabase } from '@/lib/supabase';

const FUNCTIONS_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '') + '/functions/v1';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

export async function initiateCheckout(params: {
  shipping_address: { name: string; phone: string; region: string; district: string; ward?: string; street: string };
  idempotency_key: string;
  payment_provider?: 'mpesa' | 'airtel_money' | 'mixx' | 'halopesa';
}) {
  const idempotencyKey = params.idempotency_key || `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const headers = await getAuthHeaders();
  (headers as Record<string, string>)['x-idempotency-key'] = idempotencyKey;
  const res = await fetch(`${FUNCTIONS_URL}/checkout-initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ shipping_address: params.shipping_address, payment_provider: params.payment_provider ?? 'mpesa' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Checkout failed');
  return data;
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(*, products(name_sw, name_en, product_images(url))),
      shipments(id, status, tracking_number, carrier, created_at)
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProducts(opts?: { categoryId?: string; search?: string; limit?: number; offset?: number }) {
  let q = supabase
    .from('products')
    .select('id, name_sw, name_en, price_tzs, product_images(url)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts?.search) q = q.or(`name_sw.ilike.%${opts.search}%,name_en.ilike.%${opts.search}%`);
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, sku, name_sw, name_en, description_sw, description_en, price_tzs, compare_at_price_tzs,
      product_images(id, url, sort_order)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_sw, name_en, slug, image_url')
    .eq('is_active', true)
    .eq('parent_id', null)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

// Cart: ensure cart exists, then add/update/remove items
export async function getOrCreateCart(userId: string) {
  const { data: existing } = await supabase.from('carts').select('id').eq('user_id', userId).single();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from('carts').insert({ user_id: userId }).select('id').single();
  if (error) throw error;
  return created.id;
}

export async function getCartItems(cartId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id, product_id, quantity,
      products(id, name_sw, name_en, price_tzs, product_images(url))
    `)
    .eq('cart_id', cartId);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function addCartItem(cartId: string, productId: string, quantity: number) {
  const { data: existing } = await supabase.from('cart_items').select('id, quantity').eq('cart_id', cartId).eq('product_id', productId).single();
  if (existing) {
    const { error } = await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('cart_items').insert({ cart_id: cartId, product_id: productId, quantity });
  if (error) throw error;
}

export async function updateCartItemQuantity(cartId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
    return;
  }
  const { error } = await supabase.from('cart_items').update({ quantity }).eq('cart_id', cartId).eq('product_id', productId);
  if (error) throw error;
}

export async function removeCartItem(cartId: string, productId: string) {
  await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
}

// Wishlist
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id, product_id, created_at,
      products(id, name_sw, name_en, price_tzs, product_images(url))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase.from('wishlist').insert({ user_id: userId, product_id: productId });
  if (error?.code === '23505') return; // unique violation = already in wishlist
  if (error) throw error;
}

export async function removeFromWishlist(userId: string, productId: string) {
  await supabase.from('wishlist').delete().eq('user_id', userId).eq('product_id', productId);
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const { data } = await supabase.from('wishlist').select('id').eq('user_id', userId).eq('product_id', productId).single();
  return !!data;
}

// Notifications
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, data, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

// Loyalty: sum of points for user (RLS: own rows only)
export async function getLoyaltyBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', userId);
  if (error) return 0;
  return (data ?? []).reduce((sum, row) => sum + (Number(row.points) || 0), 0);
}

// Returns: for an order (RLS: user's order only)
export async function getReturnsForOrder(orderId: string) {
  const { data, error } = await supabase
    .from('returns')
    .select('id, status, reason, refund_amount_tzs, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function requestReturn(orderId: string, reason?: string) {
  const { data, error } = await supabase
    .from('returns')
    .insert({ order_id: orderId, status: 'requested', reason: reason ?? null })
    .select('id, status, created_at')
    .single();
  if (error) throw error;
  return data;
}
