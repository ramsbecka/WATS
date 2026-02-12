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
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Remove leading 0 if present (Tanzania phone numbers start with 0)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}
