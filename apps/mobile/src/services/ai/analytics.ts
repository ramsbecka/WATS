/**
 * Analytics Integration
 * Supports: Firebase Analytics, Custom Analytics
 */

export async function trackFirebaseEvent(
  eventName: string,
  params?: Record<string, any>
): Promise<void> {
  try {
    // @ts-ignore - Dynamic import for optional dependency
    const analytics = require('@react-native-firebase/analytics');
    const analyticsInstance = analytics().default();
    
    await analyticsInstance.logEvent(eventName, params || {});
  } catch (error) {
    // Firebase Analytics not configured, skip silently
    console.debug('Firebase Analytics not available');
  }
}

export async function trackScreenView(screenName: string): Promise<void> {
  try {
    await trackFirebaseEvent('screen_view', { screen_name: screenName });
  } catch (error) {
    // Silent fail
  }
}

export async function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = 'TZS',
  items?: Array<{ item_id: string; item_name: string; quantity: number; price: number }>
): Promise<void> {
  try {
    await trackFirebaseEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items: items || [],
    });
  } catch (error) {
    // Silent fail
  }
}

export async function trackProductView(productId: string, productName: string): Promise<void> {
  try {
    await trackFirebaseEvent('view_item', {
      item_id: productId,
      item_name: productName,
    });
  } catch (error) {
    // Silent fail
  }
}

export async function trackAddToCart(productId: string, productName: string, value: number): Promise<void> {
  try {
    await trackFirebaseEvent('add_to_cart', {
      item_id: productId,
      item_name: productName,
      value,
      currency: 'TZS',
    });
  } catch (error) {
    // Silent fail
  }
}
