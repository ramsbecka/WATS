# Mfumo wa Malipo – Flow kutoka Mobile → M-Pesa → Admin

Hati hii inaeleza flow kamili ya malipo: mtumiaji anaanza checkout kwenye simu, M-Pesa inatumia STK Push, na admin anaona order na malipo kwenye dashboard.

---

## 1. Mchoro wa flow (summary)

```
[Mobile] Checkout form (anwani, simu, voucher)
    → POST /functions/v1/checkout-initiate (JWT + idempotency_key)
[Edge] checkout-initiate
    → Validate cart, create order + order_items, create payment (initiated)
    → M-Pesa STK Push (simu ya mtumiaji)
    → Clear cart
    → Return order_id, order_number, payment_id
[Mobile] Redirect to /checkout/payment?orderId=... 
    → Realtime subscription on payments + polling
[User] Enters M-Pesa PIN on phone
[M-Pesa] Sends callback to our webhook
[Edge] payment-webhook
    → Find payment by CheckoutRequestID
    → Update payment status (completed / failed)
    → If completed: order status = confirmed, create shipment, notification, audit_log
[Mobile] Realtime/poll sees payment completed → redirect to order detail
[Admin] Orders & Payments pages show order and payment (same Supabase tables)
```

---

## 2. Hatua kwa hatua

### 2.1 Mobile – Checkout (app/checkout/index.tsx)

- Mtumiaji ajaza anwani (name, phone, region, district, street) na anaweza kuweka voucher code.
- **Voucher:** `verifyVoucherCode(code, user.id)` – inahakikisha voucher ni ya mtumiaji huyo (server pia inaangalia `user_id` wakati wa checkout).
- **Place order:** `initiateCheckout({ shipping_address, idempotency_key, payment_provider: 'mpesa', voucher_code? })`.
- **Response:** `order_id`, `order_number`, `payment_id`. Kama `stk_push_failed: true`, cart haitoki na alert inaonyesha hitilafu.
- Cart inafutwa tu wakati checkout-initiate inarudi bila `stk_push_failed`; kisha redirect kwa `/checkout/payment?orderId=...&orderNumber=...`.

### 2.2 Edge Function – checkout-initiate

- **Auth:** JWT lazima; user kutoka token.
- **Idempotency:** `x-idempotency-key` (au body). Kama order yenye `idempotency_key` tayari ipo, inarudisha order ile ile (hakuna order mpya).
- **Validation:** shipping_address (phone, region, street required), cart si tupu.
- **Cart:** Inasoma cart_items na product/variant prices; unit_price_tzs = variant price ikiwa ipo, vinginevyo product price. order_items zinaandikwa na `variant_id` na `unit_price_tzs` sahihi.
- **Voucher:** Inatafuta voucher kwa `code` na **`user_id = user.id`** tu; discount inakokotwa na kuondolewa kwenye total.
- **Order:** Insert orders (status pending), order_items, payment (status initiated).
- **M-Pesa:** STK Push kwa nambari ya simu (kutoka profile au shipping_address). Kama STK fails, payment inasasishwa failed na response ina `stk_push_failed: true` (cart haijafutwa).
- **Cart clear:** Inafanywa tu baada ya order na payment kuwa created na (ikiwa mpesa) STK kusuccess; kisha response 200.

### 2.3 Mobile – Payment status (app/checkout/payment.tsx)

- Inaangalia status ya payment kwa `order_id`: `payments` table, latest by `created_at`.
- **Realtime:** Subscribe kwa `payments` (filter `id=eq.{paymentId}`) na `orders` (filter `id=eq.{orderId}`). Payment ikija completed, redirect kwa `/orders/{orderId}`.
- **Polling:** Kila sekunde 5 (fallback ikiwa realtime haifanyi kazi).
- **Timeout:** Baada ya dakika 5, alert “Retry Payment” au “Cancel”.
- **Retry:** “Retry Payment” inaita **payment-retry** (si checkout-initiate). payment-retry inatengeneza payment mpya kwa order ile ile na kutumia STK tena; hakuna order mpya. Baada ya retry, `paymentId` inasasishwa ili subscription isikilize payment mpya.

### 2.4 Edge Function – payment-retry

- **Auth:** JWT lazima.
- **Body:** `{ order_id: string }`.
- **Validation:** Order lazima iwe ya user (order.user_id === user.id) na status `pending`.
- **Action:** Insert payment mpya (status initiated), trigger M-Pesa STK Push, update payment na `provider_reference` (CheckoutRequestID).
- **Response:** `order_id`, `order_number`, `payment_id`, na ikiwa STK imeshindwa `stk_push_failed`, `message`.

### 2.5 M-Pesa – Callback

- M-Pesa inatumia **Callback URL** iliyowekwa kwenye STK (env: `MPESA_CALLBACK_URL`) – lazima iwe URL ya **payment-webhook** (e.g. `https://<project>.supabase.co/functions/v1/payment-webhook`).
- Daraja inatuma POST na body yenye `Body.stkCallback`: CheckoutRequestID, ResultCode (0 = success), CallbackMetadata (Amount, PhoneNumber, MpesaReceiptNumber, n.k.).

### 2.6 Edge Function – payment-webhook

- Inapokea callback ya M-Pesa (na optionally inaangalia signature ikiwa `PAYMENT_WEBHOOK_SECRET` ipo).
- Inatafuta payment kwa `provider_reference` = CheckoutRequestID (au MerchantRequestID).
- Inasasisha payment: `status` = completed au failed, `provider_callback` = payload kamili.
- **Kama completed:**
  - Order: `status = 'confirmed'`.
  - Shipment: insert ikiwa haijapo (admin ataweza kuongeza tracking).
  - Notification: insert kwa user “Malipo yamefanikiwa”.
  - Audit: insert audit_log.
- Inajibu M-Pesa 200 na `ResultCode: 0` ili M-Pesa isirudisha callback.

### 2.7 Admin – Orders na Payments

- **Orders:** Kusoma `orders` (na filters status). Order detail ina order_items, shipments, tracking.
- **Payments:** Kusoma `payments` (na orders join). Admin anaona status (initiated, completed, failed, refunded).
- **Refund:** Admin anaweza kubadilisha payment status kuwa refunded na order kuwa cancelled, na kuongeza return record.

---

## 3. Jedwali muhimu

| Table       | Tumia |
|------------|--------|
| orders     | Order ya mtumiaji; status: pending → confirmed (na webhook) → processing/shipped/delivered (admin). |
| order_items| Bidhaa na variant_id, unit_price_tzs, total_tzs. |
| payments   | Kila jaribio la malipo (initiated → completed/failed). provider_reference = CheckoutRequestID (au MpesaReceiptNumber baada ya success). |
| shipments  | Inaundwa na webhook wakati payment completed; admin anaongeza tracking. |
| notifications | User anapata “Malipo yamefanikiwa” wakati payment completed. |

---

## 4. Voucher na usalama

- **Mobile verifyVoucherCode(code, userId):** Inatafuta voucher kwa code na **user_id = userId** ili mtumiaji asiweze kutumia voucher ya mwenzake.
- **checkout-initiate:** Inatumia voucher kwa `code` na **user_id = user.id** tu; discount inakokotwa server-side.

---

## 5. Deploy na env

- **Deploy functions:**  
  `supabase functions deploy checkout-initiate`  
  `supabase functions deploy payment-webhook`  
  `supabase functions deploy payment-retry`  
  `supabase functions deploy payment-verify`
- **Secrets (Supabase Dashboard → Edge Functions → Secrets):**  
  `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_ENV` (sandbox|production), `MPESA_CALLBACK_URL` (URL ya payment-webhook).
- **MPESA_CALLBACK_URL:** Lazima iwe publicly reachable (e.g. Supabase function URL). Sandbox ya Daraja inaweza kuhitaji ngrok kwa local testing.

---

## 6. Quick checklist

- [ ] checkout-initiate: JWT, idempotency, cart + variant prices, voucher by user_id, order + payment + STK, clear cart on success.
- [ ] payment-webhook: Find payment by CheckoutRequestID, update payment & order, create shipment & notification on success.
- [ ] payment-retry: JWT, order owned by user, order status pending, new payment row + STK (no new order).
- [ ] Mobile: verifyVoucherCode with user_id; retry via payment-retry; realtime + polling on payment screen.
- [ ] payment-verify: Optional; returns payment status for payment_id if user owns the order (for manual "Check payment" or API consumers).
- [ ] Admin: Orders na Payments zinasoma tables zile zile; Order detail inaonyesha Payment (status, receipt); refund inasasisha payment + order + returns.
