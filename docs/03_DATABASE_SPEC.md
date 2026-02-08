# WATS – Database Spec (Maelezo ya schema)

Hii ni **document ya kubuni** ya database: entities, uhusiano, na RLS. Migrations (SQL halisi) itafuata **baada** ya kukubaliana na spec hii.

---

## Entities na uhusiano (Tables & relationships)

### Watumiaji na wauzaji
- **profiles** – Kiambatanisho na `auth.users`. Viwanja: id (FK auth.users), phone (unique), phone_normalized, display_name, avatar_url, role (customer|vendor|admin), locale, timestamps.  
- **vendors** – profile_id (FK profiles, unique), business_name, business_reg_no, contact_phone, commission_rate, is_approved, timestamps.

### Bidhaa na inventory
- **categories** – parent_id (self), name_sw, name_en, slug, image_url, sort_order, is_active.  
- **products** – vendor_id, category_id, sku, name_sw, name_en, descriptions, price_tzs, compare_at_price_tzs, cost_tzs, is_active.  
- **product_images** – product_id, url, alt_text, sort_order.  
- **inventory** – product_id, fulfillment_center_id, quantity, reserved.  
- **fulfillment_centers** – name, region, address, is_active.

### Cart na orders
- **carts** – user_id (FK profiles), unique per user.  
- **cart_items** – cart_id, product_id, quantity; unique (cart_id, product_id).  
- **orders** – order_number (unique, generated), user_id, status (pending|confirmed|…), subtotal_tzs, shipping_tzs, tax_tzs, total_tzs, shipping_address (JSONB), idempotency_key (unique).  
- **order_items** – order_id, product_id, vendor_id, quantity, unit_price_tzs, total_tzs.

### Malipo na usafirishaji
- **payments** – order_id, provider (mpesa|airtel_money|mixx|halopesa), status, amount_tzs, provider_reference, provider_callback (JSONB), idempotency_key.  
- **shipments** – order_id, status, tracking_number, carrier, fulfilled_at, delivered_at.  
- **returns** – order_id, status, reason, refund_amount_tzs.

### Zingine
- **loyalty_points** – user_id, points, source, source_id.  
- **bnpl_orders** – order_id, user_id, status, installments, installment_amount_tzs, next_due_at.  
- **livestream_sessions** – vendor_id, title, stream_url, thumbnail_url, started_at, ended_at, is_live.  
- **notifications** – user_id, title, body, data (JSONB), read_at.  
- **audit_logs** – actor_id, action, resource_type, resource_id, payload, ip_address.

---

## Enums (kwa status)

- **order_status:** pending, confirmed, processing, shipped, delivered, cancelled, returned.  
- **payment_status:** pending, initiated, completed, failed, refunded, cancelled.  
- **payment_provider:** mpesa, airtel_money, mixx, halopesa.  
- **shipment_status:** pending, picked, packed, in_transit, delivered, failed.  
- **return_status:** requested, approved, received, refunded, rejected.  
- **bnpl_status:** pending, approved, active, completed, defaulted, cancelled.  
- **app_role:** customer, vendor, admin.

---

## Indices (mbinu)

- Foreign keys: index kwenye kila FK.  
- **profiles:** phone_normalized (unique), role.  
- **orders:** user_id, status, created_at DESC, order_number, idempotency_key.  
- **payments:** order_id, status, provider_reference.  
- **notifications:** user_id, read_at (partial: unread).  
- **audit_logs:** (resource_type, resource_id), created_at DESC.

---

## RLS – kanuni za msingi

| Jedwali | Watumiaji (customer) | Vendor | Admin |
|---------|------------------------|--------|--------|
| profiles | Read/update own | Read/update own | All |
| vendors | – | Own row | All |
| categories | Read | Read | All |
| products | Read (is_active) | Own products CRUD | All |
| product_images | Read (via product) | Own (via product) | All |
| inventory | – | Read (own products) | All |
| carts, cart_items | Own only | – | – |
| orders | Own read/insert | – | All |
| order_items | Via order | – | All |
| payments | Own (via order) read | – | All |
| shipments | Own (via order) read | – | All |
| returns | Own (via order) read | – | All |
| loyalty_points | Own only | – | – |
| bnpl_orders | Own read | – | All |
| livestream_sessions | Read (is_live) | Own CRUD | All |
| notifications | Own only | – | – |
| audit_logs | – | – | Read |

**Payments na orders:** visible kwa **owner** (customer) na **admin** tu. Insert/update za payments kwenye webhook zinafanywa na **service role** (Edge Function), si na client.

---

## Triggers na mantiki (mbinu)

- **updated_at:** Kwenye jedwali zote zenye updated_at; trigger kabla ya UPDATE.  
- **order_number:** Kwa orders – generate unique (e.g. WATS-YYYYMMDD-00001) kabla ya INSERT ikiwa haijatolewa.  
- **Profile on signup:** Baada ya INSERT kwenye auth.users, insert/update profile (phone kutoka metadata/claim).

---

Spec hii inatumika kwa **kujadili** na kukubaliana kabla ya kuandika SQL migrations halisi.
