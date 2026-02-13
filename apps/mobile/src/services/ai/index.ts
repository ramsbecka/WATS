/**
 * AI Services Integration Layer
 * Supports: OpenAI, Google Cloud AI, AWS AI Services
 * Analytics: Supabase (analytics_events table)
 */

export interface AIRecommendation {
  productId: string;
  score: number;
  reason?: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ImageRecognitionResult {
  labels: Array<{ name: string; confidence: number }>;
  text?: string;
  safeSearch?: {
    adult: boolean;
    violence: boolean;
    racy: boolean;
  };
}

// =============================================================================
// Product Recommendations
// =============================================================================

export async function getProductRecommendations(
  userId: string,
  options?: { limit?: number; categoryId?: string }
): Promise<AIRecommendation[]> {
  // For now, implement simple collaborative filtering based on:
  // 1. User's order history
  // 2. Products in same category
  // 3. Popular products
  
  // TODO: Integrate with AWS Personalize or Google Recommendations AI
  // For MVP, use simple algorithm based on user behavior
  
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Get user's order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
      .limit(50);
    
    if (!orders || orders.length === 0) {
      // Return popular products for new users
      return getPopularProducts(options?.limit || 10);
    }
    
    const orderIds = orders.map((o) => o.id);
    
    // Get products user has ordered
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, products(category_id)')
      .in('order_id', orderIds);
    
    const userCategoryIds = new Set(
      orderItems?.map((item: any) => item.products?.category_id).filter(Boolean) || []
    );
    
    // Get similar products from same categories
    let query = supabase
      .from('products')
      .select('id, category_id, name_sw, name_en')
      .eq('is_active', true)
      .limit(options?.limit || 10);
    
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    } else if (userCategoryIds.size > 0) {
      query = query.in('category_id', Array.from(userCategoryIds));
    }
    
    const { data: products } = await query;
    
    return (products || []).map((p: any, index: number) => ({
      productId: p.id,
      score: 0.8 - index * 0.05, // Simple scoring
      reason: 'Based on your purchase history',
    }));
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return getPopularProducts(options?.limit || 10);
  }
}

async function getPopularProducts(limit: number): Promise<AIRecommendation[]> {
  const { supabase } = await import('@/lib/supabase');
  
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return (products || []).map((p: any, index: number) => ({
    productId: p.id,
    score: 0.7 - index * 0.05,
    reason: 'Popular products',
  }));
}

// =============================================================================
// Chatbot / Customer Support
// =============================================================================

export async function chatWithAI(
  messages: AIChatMessage[],
  context?: { userId?: string; orderId?: string }
): Promise<string> {
  // Check if OpenAI is configured
  const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Fallback to simple rule-based responses
    return getSimpleResponse(messages[messages.length - 1]?.content || '');
  }
  
  try {
    // Use OpenAI API via backend (Next.js API route)
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });
    
    if (!response.ok) {
      throw new Error('Chat API failed');
    }
    
    const data = await response.json();
    return data.response || 'I apologize, I could not process your request.';
  } catch (error) {
    console.error('Chat error:', error);
    return getSimpleResponse(messages[messages.length - 1]?.content || '');
  }
}

function getSimpleResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes('order') || lower.includes('delivery')) {
    return 'You can check your order status in the Orders section of your profile. For delivery inquiries, please contact our support team.';
  }
  
  if (lower.includes('return') || lower.includes('refund')) {
    return 'You can request a return from the Orders section. Select the order and click "Request Return".';
  }
  
  if (lower.includes('payment') || lower.includes('pay')) {
    return 'We accept M-Pesa, Airtel Money, and other mobile payment methods. Payment is processed securely during checkout.';
  }
  
  if (lower.includes('product') || lower.includes('item')) {
    return 'You can browse our products by category. Use the search bar to find specific items.';
  }
  
  return 'Thank you for contacting us. For specific inquiries, please visit the Service Center in your profile or contact our support team.';
}

// =============================================================================
// Image Recognition
// =============================================================================

export async function recognizeImage(imageUri: string): Promise<ImageRecognitionResult> {
  // Try Firebase ML Kit first (on-device, free)
  try {
    const { recognizeImageWithMLKit } = await import('./mlkit');
    return await recognizeImageWithMLKit(imageUri);
  } catch (error) {
    console.warn('ML Kit not available, trying cloud API:', error);
  }
  
  // Fallback to cloud API via backend
  try {
    const response = await fetch('/api/ai/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUri }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Vision API error:', error);
  }
  
  // Return empty result if all fail
  return {
    labels: [],
    safeSearch: { adult: false, violence: false, racy: false },
  };
}

// =============================================================================
// Analytics
// =============================================================================

export async function trackEvent(
  eventName: string,
  params?: Record<string, any>
): Promise<void> {
  // Track using Supabase analytics
  try {
    const { trackEvent: trackSupabaseEvent } = await import('./analytics');
    await trackSupabaseEvent(eventName, params);
  } catch (error) {
    // Analytics not configured, skip silently
    console.debug('Analytics tracking failed:', error);
  }
}

export async function trackProductView(productId: string, productName: string): Promise<void> {
  try {
    const { trackProductView: trackProductViewAnalytics } = await import('./analytics');
    await trackProductViewAnalytics(productId, productName);
  } catch (error) {
    // Analytics not configured, skip
  }
  
  // Also track via generic event
  await trackEvent('product_view', { product_id: productId, product_name: productName });
}

export async function trackAddToCart(productId: string, productName: string, value: number): Promise<void> {
  try {
    const { trackAddToCart: trackAddToCartAnalytics } = await import('./analytics');
    await trackAddToCartAnalytics(productId, productName, value);
  } catch (error) {
    // Analytics not configured, skip
  }
  
  // Also track via generic event
  await trackEvent('add_to_cart', { product_id: productId, product_name: productName, value });
}

// =============================================================================
// Fraud Detection
// =============================================================================

export interface FraudCheckResult {
  isFraud: boolean;
  riskScore: number;
  reasons: string[];
}

export async function checkOrderFraud(orderData: {
  userId: string;
  totalAmount: number;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: any;
}): Promise<FraudCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;
  
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Check 1: Unusual order amount
    const { data: userOrders } = await supabase
      .from('orders')
      .select('total_tzs')
      .eq('user_id', orderData.userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (userOrders && userOrders.length > 0) {
      const avgAmount = userOrders.reduce((sum, o) => sum + Number(o.total_tzs), 0) / userOrders.length;
      if (orderData.totalAmount > avgAmount * 3) {
        riskScore += 30;
        reasons.push('Order amount significantly higher than average');
      }
    }
    
    // Check 2: Multiple orders in short time
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', orderData.userId)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour
    
    if (count && count > 5) {
      riskScore += 25;
      reasons.push('Multiple orders in short time period');
    }
    
    // Check 3: New user with large order
    const { data: profile } = await supabase
      .from('profile')
      .select('created_at')
      .eq('id', orderData.userId)
      .single();
    
    if (profile) {
      const daysSinceSignup = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignup < 1 && orderData.totalAmount > 100000) {
        riskScore += 35;
        reasons.push('New user with large order');
      }
    }
    
    // Check 4: Unusual item quantities
    const hasUnusualQuantity = orderData.items.some((item) => item.quantity > 10);
    if (hasUnusualQuantity) {
      riskScore += 15;
      reasons.push('Unusually high item quantities');
    }
    
    return {
      isFraud: riskScore >= 50,
      riskScore: Math.min(riskScore, 100),
      reasons,
    };
  } catch (error) {
    console.error('Fraud check error:', error);
    return {
      isFraud: false,
      riskScore: 0,
      reasons: ['Unable to complete fraud check'],
    };
  }
}
