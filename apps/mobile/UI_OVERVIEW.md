# WATS Mobile – Jinsi app itakavyoonekana (UI Overview)

## Rangi na mtindo (Design tokens)

| Jina | Thamani | Matumizi |
|------|---------|----------|
| **Background** | `#F8FAFC` (kijivu very light) | Ukurasa wote |
| **Surface** | `#FFFFFF` (white) | Kadi, fomu, tab bar |
| **Primary** | `#0078D4` (bluu WATS) | Logo, vitone, viungo, icons active |
| **Text primary** | `#0F172A` (almost black) | Vichwa, maandishi muhimu |
| **Text secondary** | `#64748B` (grey) | Subtitles, labels |
| **Error** | `#DC2626` (red) | Hitilafu, tupu |
| **Success** | `#059669` (green) | Status nzuri (e.g. delivered) |

- **Font sizes:** Hero 32px, Title 26px, Heading 20px, Subheading 17px, Body 16px, Caption 13px.
- **Cards:** Nyeupe, border nyepesi, rounded corners (radius.lg), shadow kidogo.
- **Buttons:** Primary = bluu kamili; Outline = bluu border, background transparent.

---

## 1. Kuanza / Loading

- **Background:** #F8FAFC.
- **Katikati:** Spinner bluu (ActivityIndicator) + maandishi "Loading…" (rangi text primary).
- Baada ya ~2.5s au session kukamilika: inaelekeza kwenye Login au Home.

---

## 2. Login (Kuingia)

- **Background:** #F8FAFC (Screen).
- **Juu:** Kichwa "WATS" (bluu, font 32, bold).
- **Chini kidogo:** "Sign in with your phone number. We'll send you a code." (grey).
- **Onyo (kama .env haijawekwa):** Mstari wa manjano "Set EXPO_PUBLIC_SUPABASE_URL…".
- **Kadi nyeupe:** 
  - Input: "Phone number" (placeholder 255712345678).
  - Kitufe bluu: "Send code".
  - Baada ya kutuma: Input "6-digit code" + kitufe "Verify".
- **Mtindo:** Fomu iliyozingatia katikati, padding nzuri, KeyboardAvoidingView.

---

## 3. Home (tabs/index)

- **Juu (hero):** Kanda nyeupe, pembe zimepindwa chini (border radius).
  - "WATS" (bluu, hero font).
  - "Shop with ease. Great products, pay with mobile money." (grey).
  - **Orodha ya vitone:** "Browse products" (kitufe bluu kamili) + "Cart" (outline bluu, icon cart).
- **Chini (quick links):** Safu mbili za kadi (2 columns).
  - **Kadi 1:** Icon grid bluu kwenye mduara wa rangi bluu very light + "All products".
  - **Kadi 2:** Icon receipt + "My orders".
- **Background** wa chini: #F8FAFC.

---

## 4. Products (Orodha ya bidhaa)

- **Header:** "Products" (title) + "Choose what you need" (subtitle).
- **Search:** Input bar (placeholder "Search products...").
- **Chips (makundi):** Orodha ya horizontal – "All" + categories (name_sw). Chip iliyochaguliwa: background bluu, maandishi meupe.
- **Orodha ya bidhaa:** FlatList ya kadi.
  - Kila kadi: picha (au placeholder), jina bidhaa, bei "TZS xxx" (bluu).
  - Kupitia: tap → product detail.

---

## 5. Product detail (products/[id])

- **Picha:** Full-width, aspect ratio 1:1 (au placeholder icon ikiwa hakuna picha).
- **Pembe juu kulia:** Kitufe wishlist (heart outline / filled).
- **Chini ya picha:** Jina (title), bei (TZS, font kubwa bluu), maelezo.
- **Kadi:** "Quantity" + kitufe +/- + nambari.
- **Kitufe:** "Add to cart" (bluu).

---

## 6. Cart (Kikapu)

- **Header:** "Cart" + "X items".
- **Orodha:** Kadi kwa kila bidhaa: jina, quantity, bei (TZS), kitufe tupu (trash icon).
- **Chini:** Kadi "Total" + "TZS xxx" + kitufe "Pay now (M-Pesa)" (bluu).
- **Empty state:** Icon cart, "Your cart is empty", "Add items from the store", kitufe "Browse products" (outline).

---

## 7. Checkout

- **Header:** "Checkout" + "Enter shipping address and pay".
- **Kadi:** Jumla "Total" + "TZS xxx".
- **Fomu:** Full name, Phone, Region, District, Ward, Street.
- **Kitufe:** "Place order & pay with M-Pesa" (bluu).

---

## 8. Payment status (checkout/payment)

- **Katikati:** Icon simu (bluu), "Check your phone for payment", "Order #WATS-…".
- **Maandishi:** "Check your phone for the M-Pesa prompt…".
- **Vitone:** "View order" (bluu), "Back to home" (outline).

---

## 9. Orders (Orodha ya maagizo)

- **Header:** "My orders" + "Your order history".
- **Pull to refresh:** Inaweza kuwepo.
- **Orodha:** Kadi kwa order: order number, badge (status: Pending/Confirmed/…/Delivered), "TZS xxx", tarehe.
- **Empty:** Icon receipt, "No orders yet."

---

## 10. Order detail (orders/[id])

- **Kadi juu:** Order number, status badge, total TZS, tarehe.
- **Tracking:** Kadi za shipment (status, tracking number, carrier).
- **Items:** Kadi kwa kila bidhaa: jina, quantity, bei.
- **Returns (ikiwa shipped/delivered):** Kadi za returns + kitufe "Request return".

---

## 11. Wishlist

- **Header:** "Wishlist" + "X items".
- **Orodha:** Kadi: picha ndogo, jina, TZS, kitufe heart (remove).
- **Empty:** Icon heart, "No items in your wishlist", "Browse products".

---

## 12. Profile (Wasifu)

- **Header:** Avatar (mduara bluu light + icon person), "My account", "Account details".
- **Kadi:** Loyalty points (icon gift + "X points") ikiwa ipo.
- **Link:** Kadi "Notifications" + chevron.
- **Kadi:** Rangi ya Phone (masked), Name (optional).
- **Kitufe:** "Sign out" (outline).
- **Guest:** "Sign in to view your profile" + kitufe "Sign in".

---

## 13. Notifications

- **Header:** "Notifications" + "Mark all read" (ikiwa kuna unread).
- **Orodha:** Kadi kwa kila arifa: title, body (2 lines), tarehe. Unread: border bluu upande wa kushoto.
- **Empty:** Icon bell, "No notifications yet".

---

## Tab bar (chini)

- **Background:** Nyeupe (surface), border juu (border).
- **Tabs:** Home, Products, Cart (na badge ikiwa count > 0), Orders, Wishlist, Profile.
- **Active:** Rangi bluu (primary); inactive: grey (textSecondary).
- **Icons:** Ionicons (home, grid, cart, list, heart, person).

---

## Muhtasari wa mtindo

- **Premium, clean:** Background light grey, kadi nyeupe, spacing wazi.
- **WATS bluu (#0078D4)** kwenye vitone, vichwa, icons – mtindo unaoonekana na brand.
- **Hakuna header bars:** Header zimezima (headerShown: false), kila screen ina kichwa chake ndani.
- **Consistent:** Screen, Card, Button, Input zote zinatumia tokens (colors, spacing, radius, typography) – hivyo app inaonekana sawa kote.
