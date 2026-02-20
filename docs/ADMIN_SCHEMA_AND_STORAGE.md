# Admin – Schema and Storage (Audit)

## 1. Schema SQL – tables used by Admin

All admin tables are defined in migrations:

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

**Summary:** All admin schema is defined in `supabase/migrations/`.

---

## 2. Storage buckets (images, video, transactions)

Buckets are created in **20250208100003_storage_avatars_bucket.sql**:

| Bucket | Read | Use |
|--------|--------|----------|
| **avatars** | Public | Profile pictures (mobile app) |
| **media** | Public | Product images/video, displays; path: `media/products/{product_id}/*` or `media/{user_id}/*` |
| **miamala** | Private | Transaction files (receipts, proof); path: `miamala/{user_id}/*` |

---

## 3. Admin integration with buckets

- **media:** Admin uses the **media** bucket for product images (ProductEdit – upload to `media/products/{productId}/*`, URL stored in `product_images`).
- **avatars:** Not used by admin (for mobile app only).
- **miamala:** Can be used by admin to store receipts/attachments (not started yet; you can add an attach file section to Payments/Orders).
