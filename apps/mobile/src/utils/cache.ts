// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Cache keys
export const CACHE_KEYS = {
  categories: 'categories',
  products: (categoryId?: string, search?: string) => `products:${categoryId || 'all'}:${search || ''}`,
  profile: (userId: string) => `profile:${userId}`,
  orders: (userId: string) => `orders:${userId}`,
  wishlist: (userId: string) => `wishlist:${userId}`,
  vouchers: (userId: string) => `vouchers:${userId}`,
};
