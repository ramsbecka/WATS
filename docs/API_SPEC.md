# WATS – API Contract

Base URL (Supabase): `https://<project>.supabase.co`  
Edge Functions: `https://<project>.supabase.co/functions/v1`

Auth: `Authorization: Bearer <access_token>` (JWT from Supabase Auth).

---

## 1. Checkout – Initiate payment

**POST** `/functions/v1/checkout-initiate`

Initiates order creation and STK Push (e.g. M-Pesa). Idempotent when `x-idempotency-key` is repeated.

**Headers**
- `Authorization: Bearer <jwt>`
- `Content-Type: application/json`
- `x-idempotency-key: <string>` (required)

**Body**
```json
{
  "shipping_address": {
    "name": "Juma Mwinyi",
    "phone": "255712345678",
    "region": "Dar es Salaam",
    "district": "Kinondoni",
    "ward": "Oyster Bay",
    "street": "Plot 123, Mbezi Beach"
  },
  "payment_provider": "mpesa"
}
```

**Response 200**
```json
{
  "order_id": "uuid",
  "order_number": "WATS-20250206-00001",
  "payment_id": "uuid",
  "status": "pending",
  "message": "Order created. Complete payment on your phone."
}
```

**Errors**
- `401` – Unauthorized / Invalid token
- `400` – Missing idempotency_key, invalid shipping_address, cart empty
- `500` – Order/payment create failed or STK push error

---

## 2. Payment webhook (provider callback)

**POST** `/functions/v1/payment-webhook`

Called by payment provider (e.g. M-Pesa). Signature verification via `x-provider-signature` or `signature` header (HMAC-SHA256 of body).

**Headers**
- `x-provider-signature` or `signature` (optional but recommended in production)

**Body** – Provider-specific (e.g. M-Pesa Daraja `Body.stkCallback`).

**Response 200**
```json
{ "ResultCode": 0, "ResultDesc": "Success" }
```

---

## 3. Get order

**GET** Supabase REST: `rest/v1/orders?id=eq.<order_id>&select=...`

Or via PostgREST with RLS: user can only read own orders.

**Select example**
```
id, order_number, status, subtotal_tzs, shipping_tzs, tax_tzs, total_tzs, shipping_address, created_at, order_items(*, products(name_sw, name_en, product_images(url)))
```

**Response** – Single order object with nested `order_items` and `products`.

**Auth** – Required. User must own the order (RLS).

---

## 4. Vendor bulk product upload (admin / vendor)

**POST** Supabase REST or Edge Function: `POST /functions/v1/vendors/:id/products/bulk_upload`

**Headers**
- `Authorization: Bearer <jwt>`
- `Content-Type: application/json`

**Body**
```json
{
  "products": [
    {
      "sku": "SKU-001",
      "name_sw": "Bidhaa",
      "name_en": "Product",
      "description_sw": "Maelezo",
      "price_tzs": 25000,
      "category_id": "uuid",
      "images": ["https://..."]
    }
  ]
}
```

**Response 200**
```json
{
  "created": 5,
  "ids": ["uuid1", "uuid2", ...]
}
```

**Auth** – Vendor (own `vendor_id`) or admin. Role check in Edge Function or RLS.

---

## Pagination (Supabase)

Use `Range` header or query:
- `?offset=0&limit=20`
- Or `Range: 0-19` for PostgREST.

---

## Role checks

- **Customer:** Own profile, cart, orders, payments (read), notifications.
- **Vendor:** Own vendor row, own products, own reports; read fulfillment_centers.
- **Admin:** Full access; payments monitoring, payouts, audit logs.

All sensitive tables use RLS; Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` for server-side writes (orders, payments, notifications, audit).
