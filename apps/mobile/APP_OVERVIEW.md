# WATS Mobile – App overview

## Routes (Expo Router, file-based)

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/index.tsx` | Loading → redirect to login or `/(tabs)` |
| `/auth/login` | `app/auth/login.tsx` | Sign in (email/password or phone OTP) |
| `/auth/register` | `app/auth/register.tsx` | Register |
| `/auth/reset-password` | `app/auth/reset-password.tsx` | Reset password (email link) |
| `/(tabs)` | `app/(tabs)/_layout.tsx` | Tab bar: Home, Products, Cart, Orders, Wishlist, Profile |
| `/products/[id]` | `app/products/[id].tsx` | Product detail, add to cart / wishlist |
| `/orders/[id]` | `app/orders/[id].tsx` | Order detail, status, return |
| `/checkout` | `app/checkout/index.tsx` | Address + place order & pay |
| `/checkout/payment` | `app/checkout/payment.tsx` | Payment status (STK), view order |
| `/notifications` | `app/notifications.tsx` | Notifications |

## UI (design tokens)

- **Primary:** #0078D4 (WATS blue) – buttons, links, active icons  
- **Background:** #F8FAFC  
- **Surface:** #FFFFFF (cards, tab bar)  
- **Text:** primary #0F172A, secondary #64748B  
- **Error:** #DC2626 | **Success:** #059669  

Cards: white, light border, rounded corners, light shadow. Buttons: primary (filled blue) or outline (blue border).

## Flow

1. App load: session check → Login or Home.  
2. Auth: Login / Register / Reset password.  
3. Tabs: Home, Products (list + product detail), Cart, Orders, Wishlist, Profile.  
4. Checkout: address → place order → Edge Function `checkout-initiate` → STK push → payment status.  
5. Orders: list and detail with status; returns from order detail.
