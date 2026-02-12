# WATS Mobile – Mpangilio wa faili na muunganisho wa skrini

## Muundo wa folda (Expo Router – file-based routing)

```
app/
├── _layout.tsx          # Root: Stack + ErrorBoundary
├── index.tsx            # Ukurasa wa kwanza: loading → redirect /auth/login au /(tabs)
├── notifications.tsx    # Orodha ya arifa
│
├── auth/                # Ingia, Jisajili, Badilisha nenosiri
│   ├── _layout.tsx      # Stack: login, register, reset-password
│   ├── login.tsx        # Ingia (simu + OTP au barua pepe + nenosiri)
│   ├── register.tsx     # Jisajili (barua pepe + nenosiri)
│   └── reset-password.tsx # Badilisha nenosiri (tuma kiungo kwenye barua pepe)
│
├── (tabs)/              # Tab bar (Home, Products, Cart, Orders, Wishlist, Profile)
│   ├── _layout.tsx      # Tabs layout + icons
│   ├── index.tsx        # Home
│   ├── products.tsx     # Orodha ya bidhaa
│   ├── cart.tsx         # Kikapu
│   ├── orders.tsx       # Orodha ya maagizo
│   ├── wishlist.tsx     # Orodha ya wishlist
│   └── profile.tsx      # Wasifu + Sign out + link → notifications
│
├── products/
│   ├── index.tsx        # Redirect tu: /products → (tabs)/products
│   └── [id].tsx         # Kipekee cha bidhaa (taarifa + add to cart / wishlist)
│
├── orders/
│   └── [id].tsx         # Kipekee cha order (status, items, tracking, return)
│
└── checkout/
    ├── index.tsx        # Anwani + "Place order & pay" → checkout-initiate
    └── payment.tsx     # "Check your phone" + View order / Back to home
```

---

## Route ↔ faili (Expo Router)

| Route | Faili | Maelezo |
|-------|--------|--------|
| `/` | `app/index.tsx` | Loading → redirect /auth/login au /(tabs) |
| `/auth/login` | `app/auth/login.tsx` | Ingia (simu + OTP au barua pepe + nenosiri) |
| `/auth/register` | `app/auth/register.tsx` | Jisajili (barua pepe + nenosiri) |
| `/auth/reset-password` | `app/auth/reset-password.tsx` | Badilisha nenosiri (tuma kiungo) |
| `/(tabs)` | `app/(tabs)/_layout.tsx` + tab | Home (index), Products, Cart, Orders, Wishlist, Profile |
| `/(tabs)/` au `/(tabs)/index` | `app/(tabs)/index.tsx` | Home |
| `/(tabs)/products` | `app/(tabs)/products.tsx` | Orodha ya bidhaa |
| `/(tabs)/cart` | `app/(tabs)/cart.tsx` | Kikapu |
| `/(tabs)/orders` | `app/(tabs)/orders.tsx` | Orodha ya maagizo |
| `/(tabs)/wishlist` | `app/(tabs)/wishlist.tsx` | Wishlist |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Wasifu |
| `/products` | `app/products/index.tsx` | Redirect → `/(tabs)/products` |
| `/products/[id]` | `app/products/[id].tsx` | Kipekee cha bidhaa |
| `/orders/[id]` | `app/orders/[id].tsx` | Kipekee cha order |
| `/checkout` | `app/checkout/index.tsx` | Checkout (anwani + lipa) |
| `/checkout/payment` | `app/checkout/payment.tsx` | Status ya malipo (STK) |
| `/notifications` | `app/notifications.tsx` | Arifa |

---

## Mwendo wa skrini (nani anaelekeza wapi)

```
                    ┌─────────────┐
                    │     /       │  (app/index.tsx)
                    │  index      │
                    └──────┬──────┘
                           │
         loading ──────────┼────────────── not loading
               │            │                    │
               ▼            │         ┌──────────┴──────────┐
        [Spinner +          │         │                     │
         "Loading…"]                                    │    user hapo             user iko
                            │         │                     │
                            │         ▼                     ▼
                            │   ┌──────────────┐     ┌─────────────┐
                            │   │ /auth/login  │     │  /(tabs)    │
                            │   │ (redirect)   │     │  (redirect) │
                            │   └──────┬───────┘     └──────┬──────┘
                            │          │ verify OTP / pwd   │
                            │        ▼                      │
                            │   ┌─────────────┐             │
                            └──►│  /(tabs)    │◄────────────┘
                                └──────┬──────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
   (tabs)/index                   (tabs)/products               (tabs)/cart
   (Home)                         (orodha bidhaa)                (kikapu)
        │                              │                              │
        │ Browse products              │ product card                 │ Pay now
        │ Cart                         │ onPress                      │
        │ My orders                    ▼                              ▼
        │                         /products/[id]                 /checkout
        │                         (kipekee bidhaa)                    │
        │                              │                          Place order
        │                              │ Add to cart                  │
        │                              │ Add to wishlist              ▼
        │                              │                         /checkout/payment
        │                              │                              │
        ▼                              │                         View order →
   (tabs)/orders                  (tabs)/wishlist               /orders/[id]
        │                              │                         Back to home →
        │ order card                   │ item → /products/[id]   /(tabs)
        ▼                              │
   /orders/[id]                       │
   (kipekee order)                     │
        │                              │
        │ Request return               │
        │ (in same screen)             │
        │                              │
   (tabs)/profile ◄───────────────────┘
        │
        │ Sign in (user hapo) → /auth/login
        │ Sign out → /auth/login
        │ Notifications → /notifications
        │
        ▼
   /notifications
        │
        │ notification (order_id) → /orders/[id]
```

---

## Vipengele muhimu

1. **Kuanza app:** `_layout.tsx` inapakia session (na timeout 2.5s). `index.tsx` inaonyesha loading, halafu **Login inline** (si route) ikiwa user hapo, au redirect kwenye `/(tabs)` ikiwa user iko.
2. **Auth:** Login (`/auth/login`), Register (`/auth/register`), Reset password (`/auth/reset-password`). Baada ya kuingia sahihi → `router.replace('/(tabs)')`.
3. **Tabs:** `(tabs)/_layout.tsx` inafafanua tab 6: Home, Products, Cart, Orders, Wishlist, Profile.
4. **Products:** Orodha ni `(tabs)/products.tsx`. Kipekee ni `products/[id].tsx`. `/products` (products/index.tsx) inafanya redirect kwenye `/(tabs)/products`.
5. **Checkout:** `/(tabs)/cart` → "Pay now" → `/checkout` → baada ya order → `/checkout/payment` (params: orderId, orderNumber). Kutoka payment: "View order" → `/orders/[id]`, "Back to home" → `/(tabs)`.
6. **Profile:** "Notifications" → `/notifications`. "Sign in" → `/auth/login`. "Sign out" → `/auth/login`.

---

## Stack screens (root _layout.tsx)

Zote ziko kwenye **Stack** moja (header zimezima). Order ya `Stack.Screen` haibadilishi logic; Expo Router inaamua screen kutoka URL. Checkout ina `presentation: 'modal'` ikiwa unataka kuionyesha kama modal.
