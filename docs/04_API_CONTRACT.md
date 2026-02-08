# WATS – API Contract (Mkataba wa API)

Hii ni **mkataba wa API**: endpoints, mwili wa ombi/jibu, auth na roles. Implementation (Edge Functions, PostgREST) itafuata **baada** ya kukubaliana na contract hii.

---

## Msingi (Base)

- **Backend:** Supabase (PostgREST + Edge Functions).  
- **Auth:** JWT (Supabase Auth). Header: `Authorization: Bearer <access_token>`.  
- **Content-Type:** `application/json` kwa POST/PUT.

---

## 1. Checkout – Anzisha malipo

**Endpoint:** `POST /functions/v1/checkout-initiate` (Supabase Edge Function).

**Kusudi:** Validate cart, create order + payment, trigger STK Push. **Idempotent** kwa `x-idempotency-key`.

**Headers**
- `Authorization: Bearer <jwt>` – required  
- `Content-Type: application/json`  
- `x-idempotency-key: <string>` – required (client-generated, unique per checkout attempt)

**Request body (mfano)**
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

**Response 200 (success)**
```json
{
  "order_id": "uuid",
  "order_number": "WATS-20250206-00001",
  "payment_id": "uuid",
  "status": "pending",
  "message": "Order created. Complete payment on your phone."
}
```

**Response 200 (idempotent – same key used before)**
```json
{
  "order_id": "uuid",
  "order_number": "WATS-20250206-00001",
  "status": "confirmed",
  "idempotent": true
}
```

**Errors**
- `401` – Missing/invalid token  
- `400` – Missing idempotency_key, invalid shipping_address, cart empty  
- `500` – Order/payment create failed, STK push failed  

**Role:** Customer (authenticated). Phone for payment from **user profile**, not from body (body phone optional for address).

---

## 2. Payment webhook (provider callback)

**Endpoint:** `POST /functions/v1/payment-webhook`

**Kusudi:** Kupokea callback kutoka provider (M-Pesa, Airtel, n.k.); verify signature; update payment + order; notifications + audit.

**Headers**
- `x-provider-signature` au `signature` – HMAC (au format ya provider) ya raw body. Server inaverify kabla ya kuchukua hatua.

**Body:** Provider-specific (e.g. M-Pesa Daraja `Body.stkCallback`).

**Response 200**
```json
{ "ResultCode": 0, "ResultDesc": "Success" }
```

**Kanuni:** Signature validation required in production; idempotent handling per provider reference.

**Role:** Called by provider only (no user JWT).

---

## 3. Get order

**Endpoint:** `GET /rest/v1/orders?id=eq.<order_id>&select=...` (PostgREST)  
Au kwa Edge Function wrapper ikiwa hitaji la logic za ziada.

**Select (mfano):**  
`id,order_number,status,subtotal_tzs,shipping_tzs,tax_tzs,total_tzs,shipping_address,created_at,order_items(*,products(name_sw,name_en,product_images(url)))`

**Response:** Single object (order + nested order_items + products).  
**Auth:** JWT required. RLS: user anaona **orders zake tu** (admin anaona zote).

---

## 4. Vendor bulk product upload

**Endpoint:** `POST /functions/v1/vendors/:id/products/bulk_upload` (au PostgREST + RLS).  
Spec: **vendor_id** = `:id`; body = list of products.

**Headers**
- `Authorization: Bearer <jwt>`

**Request body (mfano)**
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
{ "created": 5, "ids": ["uuid1", "uuid2", ...] }
```

**Role:** Vendor (own vendor_id only) au Admin.

---

## Pagination

Kwa list endpoints (orders, products, n.k.):  
- PostgREST: `Range: 0-19` au query `offset=0&limit=20`.  
- Default page size: 20; max: 100.

---

## Role summary

| Endpoint / resource | customer | vendor | admin |
|--------------------|----------|--------|-------|
| checkout-initiate | ✓ (own) | – | – |
| payment-webhook | – | – | (provider only) |
| GET orders | Own | – | All |
| bulk_upload products | – | Own vendor | All |

Hii contract inatumika kwa **kujadili** na kukubaliana kabla ya kuandika code ya API (Edge Functions + RLS).
