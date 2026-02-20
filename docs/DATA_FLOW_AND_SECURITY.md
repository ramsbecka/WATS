# WATS – Data Flow and Security (Admin ↔ Mobile)

Admin and mobile **do not talk to each other directly**. They both use **Supabase** as the single backend. Data flows as follows.

---

## 1. How admin and mobile communicate

| Layer | Admin | Mobile |
|-------|--------|--------|
| **Backend** | Same Supabase project | Same Supabase project |
| **Env** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Auth** | Email/password → `admin_profile` (admin only) | Email/password or phone OTP → `profile` (customers) |
| **Data** | Same tables: products, categories, orders, vouchers, banners, etc. | Same tables; RLS limits rows by `auth.uid()` or admin |

So:

- **Speed:** One backend, no extra hop between admin and mobile.
- **Simplicity:** Single source of truth (Supabase). Admin creates/updates products and content; mobile reads and creates orders/carts.
- **Verification:** Same table and column names on both sides (e.g. `name_en`, `price_tzs`, `image_url`, `order_items.variant_id`).

---

## 2. Main data flows

### Products and categories

- **Admin:** Creates/updates products, categories, product_images, product_variants (via ProductEdit, Categories, BulkUpload).
- **Mobile:** Reads via `getProducts`, `getProduct`, `getCategories`, `getSubCategories`. Uses realtime subscriptions so list updates when admin changes data.
- **Alignment:** Both use `name_en`, `price_tzs`, `product_images(url)`, `categories.image_url`, `categories.name_en`.

### Orders and checkout

- **Mobile:** User adds to cart (cart_items with optional `variant_id`). Checkout calls Edge Function **checkout-initiate** with shipping address, idempotency key, optional voucher code.
- **Edge Function (checkout-initiate):** Uses **service role**; validates JWT; loads cart_items with **product and variant prices**; applies voucher only if it belongs to the current user (`user_id`); creates order and order_items (including **variant_id** and correct unit_price_tzs); creates payment; triggers M-Pesa STK Push.
- **Admin:** Reads/updates orders, order_items, shipments, returns (OrderDetail, Orders, Shipments, Returns). Sees same `order_items` (product_id, variant_id, unit_price_tzs, total_tzs).

So:

- **Correctness:** Checkout uses **variant price** when the cart item has a variant; order_items store **variant_id** and correct **unit_price_tzs** so admin and mobile see the same totals.
- **Security:** Voucher application is restricted to the signed-in user’s vouchers.

### Payments

- **Mobile:** Only initiates payment via checkout-initiate (no card or sensitive payment data stored in app).
- **Provider (e.g. M-Pesa):** Sends result to Edge Function **payment-webhook** (server-to-server).
- **Admin:** Reads payments table; does not initiate payments from the dashboard.

### Payments (full flow)

- **Mobile:** Checkout calls **checkout-initiate** (order + payment + M-Pesa STK). Payment status screen uses **payment-retry** for “Retry Payment” (same order, new STK). See **docs/PAYMENT_FLOW.md** for the full flow: Mobile → M-Pesa → payment-webhook → Admin.
- **Voucher:** Mobile verifies voucher with **user_id** (verifyVoucherCode(code, userId)); server applies voucher only when **user_id** matches.

### Content (banners, splash)

- **Admin:** Writes to `banners` (image_url, title_en, button_link, link_type), `splash_images`. Splash order: admin uses “move up/down” to change `sort_order`; the two rows are swapped so order is always consistent.
- **Mobile:** Reads with `getBanners()`, `getSplashImages()`; uses same column names. **Splash:** `getSplashImages()` orders by `sort_order` ascending (then `id`). Subscribes to realtime on `splash_images`; when admin reorders, mobile refetches and **resets to the first slide** so the new order is shown immediately (no stale “slide 2 as first”).
- **Realtime:** Table `splash_images` must be in publication `supabase_realtime` (migration `20250220000019_realtime_splash_images.sql` or enable in Dashboard → Database → Replication).

---

## 2b. Admin leads mobile (realtime and focus)

**Admin is the source of truth.** Mobile always follows what is in Supabase.

| Data | Realtime | When mobile refreshes |
|------|----------|------------------------|
| **Categories** | Yes (`subscribeToCategories`) | On table change; cache cleared and list updated. |
| **Products** | Yes (`subscribeToProducts`) | On table change; Home `loadData()` runs. |
| **Banners** | Yes (`subscribeToBanners`) | On table change; `getBanners()` → `setBanners`. |
| **Splash images** | Yes (`subscribeToSplashImages`) | On table change; SplashScreen refetches. |

**Home tab:** When the user returns to the Home tab, `useFocusEffect` runs `loadData(skipLoading: true)` so categories, products, and banners are always current. Together with AppState `active` and realtime subscriptions, admin changes are reflected reliably and with care.

---

## 3. Security summary

| Item | Detail |
|------|--------|
| **Secrets** | Only anon key in admin/mobile env. Service role used only in Edge Functions (checkout-initiate, payment-webhook). |
| **Auth** | Admin: `admin_profile` + RLS. Mobile: `profile` + RLS. JWT sent in `Authorization` for Edge Function calls. |
| **RLS** | Customers see own profile, cart, orders, vouchers, wishlist. Admin (via `is_admin()`) can read/update all. |
| **Checkout** | Server-side only; idempotency key; voucher tied to current user; no card data. |
| **Webhook** | payment-webhook verifies provider (e.g. signature) and updates payment/order server-side. |

---

## 4. What was fixed in this audit

1. **Checkout variant price and variant_id**  
   - **Before:** checkout-initiate used only product `price_tzs` and did not save `variant_id` on order_items.  
   - **After:** Cart items are loaded with `variant_id` and `product_variants(price_tzs)`. Unit price is variant price when present, else product price. order_items are inserted with `variant_id` and correct `unit_price_tzs`.

2. **Voucher application**  
   - **Before:** Voucher was looked up by code only; any user could use any unused code.  
   - **After:** Voucher is looked up by code **and** `user_id = user.id`, so only the voucher owner can use it at checkout.

3. **Logging**  
   - Removed checkout URL and response logging from the mobile API client to avoid leaking URLs in production.

---

## 5. Quick checklist for future changes

- Use the **same table and column names** in admin and mobile (and in Edge Functions).
- For new payment or order logic, keep it **server-side** (Edge Functions) and use **service role** only there.
- When adding new “shared” data (e.g. new product fields), update **admin write** and **mobile read** (and any Edge Function that builds orders) so they stay in sync.
