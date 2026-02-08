/**
 * Pure validation helpers for checkout – unit testable.
 */

export interface ShippingAddress {
  name?: string;
  phone?: string;
  region?: string;
  district?: string;
  ward?: string;
  street?: string;
}

export function validateShippingAddress(addr: ShippingAddress | null | undefined): { valid: boolean; error?: string } {
  if (!addr || typeof addr !== 'object') {
    return { valid: false, error: 'Invalid shipping_address' };
  }
  const phone = addr.phone?.trim();
  const region = addr.region?.trim();
  const street = addr.street?.trim();
  if (!phone) return { valid: false, error: 'Phone required' };
  if (!region) return { valid: false, error: 'Region required' };
  if (!street) return { valid: false, error: 'Street required' };
  return { valid: true };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
