# WATS – Supabase migrations audit

## Summary

Migrations zimeunganishwa kuwa **faili 6**. Schema kamili, RLS, storage, seed, helper functions, product variants system, reviews/returns system, na shipment tracking system ziko sawa na mradi.

---

## Mpangilio (6 migrations)

| # | File | Kazi |
|---|------|------|
| 1 | 20250212000001_01_complete_schema.sql | Schema kamili: profile/admin_profile, vendors (nullable), products, orders, RLS, storage buckets/policies, seed, handle_new_user trigger |
| 2 | 20250212000002_02_helper_functions.sql | Helper functions: grant_admin_by_email() |
| 3 | 20250212000003_03_fix_public_read_policies.sql | Rekebisha RLS: products/categories/images public read, storage public read kwa products, admin upload/update/delete kwa products |
| 4 | 20250212000004_04_product_variants.sql | Product variants system: variant_attributes, variant_options, product_variants, variant_values tables, RLS, seed data (Size, Color) |
| 5 | 20250212000005_05_reviews_returns.sql | Product reviews/ratings system na returns yenye comments/images: product_reviews, review_images, return_images tables, RLS, get_product_rating function |
| 6 | 20250212000006_06_shipment_tracking.sql | Shipment tracking system: shipment_tracking_events table, estimated_delivery_date field, auto-tracking trigger, RLS policies |

**Kukimbiza:** `supabase db reset` (fresh) au `supabase db push` (project tayari linked).

---

## Tables vs schema

| Table | Mobile | Admin | Functions | Schema |
|-------|--------|-------|-----------|--------|
| profile | ✓ | - | ✓ | ✓ (watumiaji: customer tu) |
| admin_profile | - | ✓ | ✓ | ✓ (wasimamizi) |
| vendors | - | ✓ | ✓ | ✓ (maduka – admin anaongeza/hariri, profile_id nullable) |
| categories | ✓ | ✓ | - | ✓ |
| products | ✓ | ✓ | ✓ | ✓ |
| product_images | - | ✓ | ✓ | ✓ |
| product_variant_attributes | - | ✓ | - | ✓ |
| product_variant_options | - | ✓ | - | ✓ |
| product_variants | - | ✓ | ✓ | ✓ |
| product_variant_values | - | ✓ | - | ✓ |
| product_reviews | ✓ | ✓ | ✓ | ✓ |
| review_images | ✓ | ✓ | - | ✓ |
| return_images | ✓ | ✓ | - | ✓ |
| shipment_tracking_events | ✓ | ✓ | ✓ | ✓ |
| inventory | - | ✓ | ✓ | ✓ |
| carts, cart_items | ✓ | - | ✓ | ✓ |
| orders, order_items | ✓ | ✓ | ✓ | ✓ |
| payments, shipments, returns | ✓ | ✓ | ✓ | ✓ |
| wishlist | ✓ | - | - | ✓ |
| loyalty_points, bnpl_orders | ✓ | - | ✓ | ✓ |
| livestream_sessions | - | - | ✓ | ✓ |
| notifications | ✓ | - | ✓ | ✓ |
| audit_logs | - | - | ✓ | ✓ |
| fulfillment_centers | - | ✓ | ✓ | ✓ |

---

## Admin login

- **Kuweka admin:** Supabase → SQL Editor:  
  `SELECT public.grant_admin_by_email('email-yako@example.com');`  
  (Ingiza mtumiaji kwenye admin_profile na kuondoa kutoka profile.)

---

## Storage

- Buckets: **avatars**, **media**, **miamala**
- Admin: upload kwenye `media/products/{product_id}/*`; policy `media_select_authenticated` inaruhusu list/read.
- Mobile: profile avatar upload/read kwenye `avatars/{user_id}/*` (bucket public).

---

## Ukaguzi: Admin + Mobile vs migrations

**Admin (apps/admin)** – tables na columns zilizokaguliwa:

| Table | Select | Insert | Update | Columns zinazotumika |
|-------|--------|--------|--------|----------------------|
| admin_profile | ✓ (id) | - | - | id (admin check) |
| vendors | ✓ | ✓ | ✓ | id, business_name, business_reg_no, contact_phone, commission_rate, is_approved, created_at |
| categories | ✓ | ✓ | ✓ | id, name_sw, name_en, slug, image_url, sort_order, is_active, parent_id |
| products | ✓ | ✓ | ✓ | *, vendor_id, category_id, sku, name_sw, name_en, description_sw/en, price_tzs, compare_at_price_tzs, cost_tzs, is_active |
| product_images | ✓ | ✓ | ✓/del | id, url, sort_order, product_id |
| orders | ✓ | - | ✓ | id, order_number, status, total_tzs, created_at, shipping_address, order_items(products) |
| order_items | ✓ | - | - | id, quantity, unit_price_tzs, total_tzs, vendor_id, order_id, products(id, name_sw, name_en) |
| payments | ✓ | - | - | id, order_id, provider, status, amount_tzs, created_at, orders(order_number) |
| shipments | ✓ | ✓ | ✓ | id, order_id, status, tracking_number, carrier, created_at |
| returns | ✓ | - | ✓ | id, order_id, status, reason, refund_amount_tzs, created_at, orders(order_number, total_tzs) |
| inventory | ✓ | - | ✓ | id, product_id, quantity, reserved, updated_at, products(..., sku), fulfillment_centers(id, name, region) |
| fulfillment_centers | ✓ | ✓ | ✓ | id, name, region, address, is_active, created_at |

**Mobile (apps/mobile)** – tables na columns:

| Table | Select | Insert | Update | Upsert | Columns |
|-------|--------|--------|--------|--------|---------|
| profile | ✓ | - | ✓ | ✓ (ensureProfile) | id, phone, email, display_name, avatar_url, role, locale, updated_at |
| orders | ✓ | - | - | - | *, order_items(*, products(...), product_images(url)), shipments(...) |
| products | ✓ | - | - | - | id, name_sw, name_en, price_tzs, product_images(url); single: sku, description_sw/en, compare_at_price_tzs |
| categories | ✓ | - | - | - | id, name_sw, name_en, slug, image_url, parent_id, sort_order |
| carts | ✓ | ✓ | - | - | id, user_id |
| cart_items | ✓ | ✓ | ✓ | - | id, product_id, quantity, cart_id, products(...) |
| wishlist | ✓ | ✓ | - | - | user_id, product_id |
| notifications | ✓ | - | ✓ | - | read_at |
| loyalty_points | ✓ | - | - | - | - |
| returns | ✓ | - | - | - | - |

**Enums:** order_status, payment_status, shipment_status, return_status, payment_provider – zote ziko kwenye migration 01.

**RLS:** Admin inatumia session + ukweli kuwa rekodi ipo kwenye `admin_profile`; policies za `*_admin_all` na `profile_*` / `admin_profile_*` ziko kwenye migration 01. Mobile: profile_select_own/update_own/insert_own, carts_own, cart_items_own, orders_select_own/insert_own, wishlist_own, n.k.

**Hitimio:** Migrations 3 zimebeba kila kitu kinachohitajika na admin na mobile; schema imeunganishwa na imekamilika; anonymous users wanaweza kusoma products/categories/images.
