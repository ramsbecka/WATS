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
  voucher_code?: string;
}) {
  const idempotencyKey = params.idempotency_key || `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const headers = await getAuthHeaders();
  (headers as Record<string, string>)['x-idempotency-key'] = idempotencyKey;
  const res = await fetch(`${FUNCTIONS_URL}/checkout-initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shipping_address: params.shipping_address,
      payment_provider: params.payment_provider ?? 'mpesa',
      voucher_code: params.voucher_code,
    }),
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
      order_items(*, products(name_en, product_images(url))),
      shipments(id, status, tracking_number, carrier, created_at)
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
}

export async function getPaymentStatus(orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('id, status, provider_reference, provider_callback, amount_tzs, created_at, updated_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function verifyPayment(paymentId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${FUNCTIONS_URL}/payment-verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payment_id: paymentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment verification failed');
  return data;
}

export async function getOrders(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_tzs, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// Vouchers
export async function getVouchers(userId: string) {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      id, code, discount_percentage, discount_amount_tzs, min_order_amount_tzs,
      max_discount_amount_tzs, is_used, used_at, usage_count, max_usage,
      valid_from, valid_until, created_at,
      products(id, name_en, product_images(url)),
      orders(id, order_number)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAvailableVouchers(userId: string) {
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      id, code, discount_percentage, discount_amount_tzs, min_order_amount_tzs,
      max_discount_amount_tzs, is_used, usage_count, max_usage,
      valid_from, valid_until,
      products(id, name_en, product_images(url))
    `)
    .eq('user_id', userId)
    .eq('is_used', false)
    .gte('valid_until', new Date().toISOString())
    .order('valid_until', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function verifyVoucherCode(code: string) {
  const { data, error } = await supabase
    .from('vouchers')
    .select('id, code, discount_percentage, min_order_amount_tzs, max_discount_amount_tzs, is_used, usage_count, max_usage, valid_until')
    .eq('code', code.toUpperCase())
    .eq('is_used', false)
    .gte('valid_until', new Date().toISOString())
    .single();
  if (error) throw error;
  if (data.usage_count >= data.max_usage) {
    throw new Error('Voucher has reached maximum usage limit');
  }
  return data;
}

export async function getProducts(opts?: { categoryId?: string; search?: string; limit?: number; offset?: number }) {
  let q = supabase
    .from('products')
    .select(`
      id, name_en, price_tzs, compare_at_price_tzs, 
      product_images(url),
      product_reviews(rating)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts?.search) q = q.ilike('name_en', `%${opts.search}%`);
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  
  // Calculate average rating and order count for each product
  const productsWithStats = (data ?? []).map((product: any) => {
    const reviews = product.product_reviews || [];
    const ratings = reviews.map((r: any) => r.rating).filter(Boolean);
    const average_rating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length 
      : 0;
    
    // Get order count from order_items
    // Note: This is a simplified version - in production you might want to fetch this separately
    const order_count = 0; // Will be fetched separately if needed
    
    return {
      ...product,
      average_rating: Math.round(average_rating * 10) / 10, // Round to 1 decimal
      total_reviews: ratings.length,
      order_count,
    };
  });
  
  return { data: productsWithStats, count: count ?? 0 };
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, sku, name_en, description_en, price_tzs, compare_at_price_tzs,
      product_images(id, url, sort_order),
      product_variants(
        id, sku, price_tzs, compare_at_price_tzs, quantity, is_active,
        product_variant_values(
          option_id,
          product_variant_options(
            id, value_en,
            product_variant_attributes(id, name_en)
          )
        ),
        variant_images(id, url, sort_order)
      ),
      product_features(id, title_en, description_en, media_type, media_url, sort_order)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function getCategories(useCache = true) {
  if (useCache) {
    const cache = require('@/utils/cache');
    const { Category } = require('@/types');
    const cached = cache.getCached<Category[]>('categories');
    if (cached) return cached;
  }
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_en, slug, image_url')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order');
  if (error) throw error;
  const result = data ?? [];
  
  if (useCache) {
    const cache = require('@/utils/cache');
    cache.setCached('categories', result);
  }
  
  return result;
}

export async function getSubCategories(parentId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_en, slug, image_url, parent_id')
    .eq('is_active', true)
    .eq('parent_id', parentId)
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
      id, product_id, quantity, variant_id,
      products(id, name_en, price_tzs, product_images(url)),
      product_variants(id, price_tzs, sku)
    `)
    .eq('cart_id', cartId);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function addCartItem(cartId: string, productId: string, quantity: number, variantId?: string) {
  const query = supabase.from('cart_items').select('id, quantity').eq('cart_id', cartId).eq('product_id', productId);
  if (variantId) {
    query.eq('variant_id', variantId);
  } else {
    query.is('variant_id', null);
  }
  const { data: existing } = await query.single();
  if (existing) {
    const { error } = await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from('cart_items').insert({ cart_id: cartId, product_id: productId, quantity, variant_id: variantId || null });
  if (error) throw error;
}

export async function updateCartItemQuantity(cartId: string, productId: string, quantity: number, variantId?: string) {
  if (quantity <= 0) {
    const query = supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
    if (variantId) {
      query.eq('variant_id', variantId);
    } else {
      query.is('variant_id', null);
    }
    await query;
    return;
  }
  const query = supabase.from('cart_items').update({ quantity }).eq('cart_id', cartId).eq('product_id', productId);
  if (variantId) {
    query.eq('variant_id', variantId);
  } else {
    query.is('variant_id', null);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function removeCartItem(cartId: string, productId: string, variantId?: string) {
  const query = supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  if (variantId) {
    query.eq('variant_id', variantId);
  } else {
    query.is('variant_id', null);
  }
  await query;
}

// Wishlist
export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id, product_id, created_at,
      products(id, name_en, price_tzs, product_images(url))
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
    .select('id, status, reason, comment, refund_amount_tzs, created_at, return_images(url, sort_order)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Product Reviews
export async function getProductReviews(productId: string) {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      id, rating, comment, is_verified_purchase, created_at,
      profile(id, display_name, avatar_url),
      review_images(url, sort_order)
    `)
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProductRating(productId: string) {
  const { data, error } = await supabase.rpc('get_product_rating', { product_uuid: productId });
  if (error) throw error;
  return data?.[0] ?? { average_rating: 0, total_reviews: 0 };
}

export async function submitReview(productId: string, orderId: string | null, rating: number, comment?: string, imageUrls?: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const { data: reviewData, error: reviewError } = await supabase
    .from('product_reviews')
    .insert({
      product_id: productId,
      order_id: orderId,
      rating,
      comment: comment || null,
      is_verified_purchase: orderId !== null,
      user_id: user.id,
    })
    .select('id')
    .single();
  if (reviewError) throw reviewError;
  if (imageUrls && imageUrls.length > 0 && reviewData) {
    const { error: imgError } = await supabase.from('review_images').insert(
      imageUrls.map((url, i) => ({ review_id: reviewData.id, url, sort_order: i }))
    );
    if (imgError) throw imgError;
  }
  return reviewData;
}

// Return Images - Note: This function expects base64 data (without data: prefix), use FileSystem.readAsStringAsync in the component
export async function uploadReturnImage(returnId: string, imageBase64: string, mimeType: string = 'image/jpeg') {
  // Upload to storage first, then save URL
  const fileExt = mimeType.split('/')[1] || 'jpg';
  const fileName = `${returnId}/${crypto.randomUUID()}.${fileExt}`;
  // Remove data: prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  // Convert base64 to Uint8Array
  const byteChars = atob(base64Data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const arrayBuffer = new Uint8Array(byteNumbers).buffer;
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(`returns/${fileName}`, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('media').getPublicUrl(`returns/${fileName}`);
  const { data, error } = await supabase
    .from('return_images')
    .insert({ return_id: returnId, url: urlData.publicUrl, sort_order: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function requestReturn(orderId: string, reason?: string, comment?: string) {
  const { data, error } = await supabase
    .from('returns')
    .insert({ order_id: orderId, reason: reason || null, comment: comment || null })
    .select('id, status, created_at')
    .single();
  if (error) throw error;
  return data;
}

// =============================================================================
// Referral Codes (Friend's Code / Invite Friend)
// =============================================================================

export async function getReferralCode(userId: string): Promise<string> {
  try {
    // Check if user has a referral code
    const { data: existing, error: checkError } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is OK
      throw checkError;
    }
    
    if (existing?.code) {
      return existing.code;
    }
    
    // Generate new code using function
    const { data, error } = await supabase.rpc('ensure_referral_code', { p_user_id: userId });
    if (error) throw error;
    return data || '';
  } catch (error: any) {
    console.error('Failed to get referral code:', error);
    throw error;
  }
}

export async function getReferralStats(userId: string) {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('code, total_referrals, referral_bonus_points, referred_bonus_points')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function verifyReferralCode(code: string) {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('id, user_id, code, is_active')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function applyReferralCode(code: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  // Verify code exists and is active
  const referralCode = await verifyReferralCode(code);
  
  // Check if user was already referred
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', user.id)
    .single();
  
  if (existing) {
    throw new Error('You have already used a referral code');
  }
  
  // Create referral record
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referralCode.user_id,
      referred_id: user.id,
      referral_code_id: referralCode.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update referral code stats
  await supabase.rpc('increment_referral_count', { p_code_id: referralCode.id });
  
  return data;
}

// =============================================================================
// User Addresses (Address Management)
// =============================================================================

export async function getUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addUserAddress(userId: string, address: {
  label: string;
  recipient_name: string;
  recipient_phone: string;
  region: string;
  district: string;
  ward?: string;
  street_address: string;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
      ...address,
      is_default: address.is_default ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserAddress(addressId: string, updates: {
  label?: string;
  recipient_name?: string;
  recipient_phone?: string;
  region?: string;
  district?: string;
  ward?: string;
  street_address?: string;
  is_default?: boolean;
}) {
  const { data, error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', addressId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserAddress(addressId: string) {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId);
  if (error) throw error;
}

// =============================================================================
// Recently Viewed Products
// =============================================================================

export async function getRecentlyViewed(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('recently_viewed')
    .select(`
      id, viewed_at,
      products(
        id, name_en, price_tzs,
        product_images!inner(url)
      )
    `)
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    ...item,
    product: {
      ...item.products,
      image: item.products?.product_images?.[0]?.url,
    },
  }));
}

export async function addToRecentlyViewed(userId: string, productId: string) {
  const { error } = await supabase.rpc('upsert_recently_viewed', {
    p_user_id: userId,
    p_product_id: productId,
  });
  if (error) throw error;
}

export async function clearRecentlyViewed(userId: string) {
  const { error } = await supabase
    .from('recently_viewed')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// =============================================================================
// Store Followed (Follow Vendors)
// =============================================================================

export async function getFollowedStores(userId: string) {
  const { data, error } = await supabase
    .from('store_followed')
    .select(`
      id, created_at,
      vendors(
        id, business_name, contact_phone,
        products(id, product_images!inner(url))
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item: any) => ({
    ...item,
    vendor: {
      ...item.vendors,
      thumbnail: item.vendors?.products?.[0]?.product_images?.[0]?.url,
    },
  }));
}

export async function followStore(userId: string, vendorId: string) {
  const { error } = await supabase
    .from('store_followed')
    .insert({ user_id: userId, vendor_id: vendorId });
  if (error?.code === '23505') return; // Already following
  if (error) throw error;
}

export async function unfollowStore(userId: string, vendorId: string) {
  const { error } = await supabase
    .from('store_followed')
    .delete()
    .eq('user_id', userId)
    .eq('vendor_id', vendorId);
  if (error) throw error;
}

export async function isFollowingStore(userId: string, vendorId: string): Promise<boolean> {
  const { data } = await supabase
    .from('store_followed')
    .select('id')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .single();
  return !!data;
}

// Splash Images
export async function getSplashImages() {
  const { data, error } = await supabase
    .from('splash_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Banners
export async function getBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
