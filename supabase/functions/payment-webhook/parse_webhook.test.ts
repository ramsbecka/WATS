/**
 * Unit tests for payment webhook parsing (M-Pesa callback body).
 * Run: deno test supabase/functions/payment-webhook/parse_webhook.test.ts
 */

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

// Inline parsing logic used by webhook (extracted for testing)
function parseMpesaStkCallback(body: unknown): { checkoutRequestID?: string; resultCode?: number; success: boolean } {
  const b = body as { Body?: { stkCallback?: { CheckoutRequestID: string; ResultCode: number } } };
  const stk = b?.Body?.stkCallback;
  if (!stk) return { success: false };
  return {
    checkoutRequestID: stk.CheckoutRequestID,
    resultCode: stk.ResultCode,
    success: stk.ResultCode === 0,
  };
}

Deno.test('parseMpesaStkCallback – missing Body returns success false', () => {
  const r = parseMpesaStkCallback({});
  assertEquals(r.success, false);
  assertEquals(r.checkoutRequestID, undefined);
});

Deno.test('parseMpesaStkCallback – ResultCode 0 is success', () => {
  const r = parseMpesaStkCallback({
    Body: {
      stkCallback: {
        MerchantRequestID: 'm-id',
        CheckoutRequestID: 'ck-id-123',
        ResultCode: 0,
        ResultDesc: 'Success',
      },
    },
  });
  assertEquals(r.success, true);
  assertEquals(r.checkoutRequestID, 'ck-id-123');
  assertEquals(r.resultCode, 0);
});

Deno.test('parseMpesaStkCallback – ResultCode 1 is failure', () => {
  const r = parseMpesaStkCallback({
    Body: {
      stkCallback: {
        CheckoutRequestID: 'ck-id-456',
        ResultCode: 1,
        ResultDesc: 'Cancelled',
      },
    },
  });
  assertEquals(r.success, false);
  assertEquals(r.resultCode, 1);
  assertEquals(r.checkoutRequestID, 'ck-id-456');
});
