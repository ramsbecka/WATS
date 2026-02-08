/**
 * Unit tests for checkout validation (payment flow).
 * Run: deno test supabase/functions/_shared/checkout_validation.test.ts
 */
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { validateShippingAddress, normalizePhone } from './checkout_validation.ts';

Deno.test('validateShippingAddress – rejects null/undefined', () => {
  assertEquals(validateShippingAddress(null).valid, false);
  assertEquals(validateShippingAddress(undefined).valid, false);
});

Deno.test('validateShippingAddress – rejects missing phone', () => {
  const r = validateShippingAddress({
    region: 'Dar',
    street: 'Plot 1',
  });
  assertEquals(r.valid, false);
  assertEquals(r.error, 'Phone required');
});

Deno.test('validateShippingAddress – rejects missing region', () => {
  const r = validateShippingAddress({
    phone: '255712345678',
    street: 'Plot 1',
  });
  assertEquals(r.valid, false);
  assertEquals(r.error, 'Region required');
});

Deno.test('validateShippingAddress – rejects missing street', () => {
  const r = validateShippingAddress({
    phone: '255712345678',
    region: 'Dar',
  });
  assertEquals(r.valid, false);
  assertEquals(r.error, 'Street required');
});

Deno.test('validateShippingAddress – accepts valid address', () => {
  const r = validateShippingAddress({
    name: 'Juma',
    phone: '255712345678',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    street: 'Plot 123',
  });
  assertEquals(r.valid, true);
  assertEquals(r.error, undefined);
});

Deno.test('normalizePhone – strips non-digits', () => {
  assertEquals(normalizePhone('255 712 345 678'), '255712345678');
  assertEquals(normalizePhone('+255-712-345-678'), '255712345678');
});
