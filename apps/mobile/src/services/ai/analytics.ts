/**
 * Analytics Integration
 * Uses Supabase for analytics tracking
 */

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

// Generate or retrieve session ID
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return sessionId;
}

export async function trackEvent(
  eventName: string,
  params?: Record<string, any>
): Promise<void> {
  try {
    const { user } = useAuthStore.getState();
    
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: eventName,
        event_params: params || {},
        user_id: user?.id || null,
        session_id: getSessionId(),
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.debug('Analytics tracking failed:', error.message);
    }
  } catch (error) {
    // Silent fail - analytics should not break the app
    console.debug('Analytics tracking error:', error);
  }
}

export async function trackScreenView(screenName: string): Promise<void> {
  await trackEvent('screen_view', { screen_name: screenName });
}

export async function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = 'TZS',
  items?: Array<{ item_id: string; item_name: string; quantity: number; price: number }>
): Promise<void> {
  await trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items: items || [],
  });
}

export async function trackProductView(productId: string, productName: string): Promise<void> {
  await trackEvent('view_item', {
    item_id: productId,
    item_name: productName,
  });
}

export async function trackAddToCart(productId: string, productName: string, value: number): Promise<void> {
  await trackEvent('add_to_cart', {
    item_id: productId,
    item_name: productName,
    value,
    currency: 'TZS',
  });
}
