# Admin – Schema na Storage (Ukaguzi)

## 1. Schema SQL – tables zinazotumika na Admin

Tables zote za admin zipo kwenye migrations:

| Table | Migration | Admin usage |
|-------|-----------|-------------|
| profiles | 20250206000001 + 100003 | Layout (admin role check) |
| vendors | 20250206000001 | Products, Vendors, Payouts, Bulk upload |
| categories | 20250206000001 | Products, Categories |
| products | 20250206000001 | Products, Inventory, OrderDetail |
| product_images | 20250206000001 | ProductEdit |
| fulfillment_centers | 20250206000001 | FulfillmentCenters, Inventory |
| inventory | 20250206000001 | Inventory, Dashboard (low stock) |
| orders | 20250206000001 | Orders, OrderDetail, Dashboard, Payouts |
| order_items | 20250206000001 | OrderDetail, Payouts |
| payments | 20250206000001 | Payments |
| shipments | 20250206000001 | Shipments, OrderDetail |
| returns | 20250206000001 | Returns, Dashboard |

**Hitimisho:** Schema za admin zimeundwa zote kwenye `supabase/migrations/`.

---

## 2. Storage buckets (picha, video, miamala)

Buckets zimeundwa kwenye **20250208100003_storage_avatars_bucket.sql**:

| Bucket | Kusoma | Matumizi |
|--------|--------|----------|
| **avatars** | Public | Picha za wasifu (mobile app) |
| **media** | Public | Picha/video za bidhaa, maonyesho; path: `media/products/{product_id}/*` au `media/{user_id}/*` |
| **miamala** | Private | Faili za miamala (receipts, uthibitisho); path: `miamala/{user_id}/*` |

---

## 3. Muunganisho wa Admin na buckets

- **media:** Admin inatumia bucket **media** kwa picha za bidhaa (ProductEdit – upload kwenye `media/products/{productId}/*`, URL inahifadhiwa kwenye `product_images`).
- **avatars:** Hatumiki na admin (ni kwa app ya mobile).
- **miamala:** Inaweza kutumika na admin kuhifadhi receipts/attachments (kwa sasa haijaanza; unaweza kuongeza kipande cha “attach file” kwenye Payments/Orders).
