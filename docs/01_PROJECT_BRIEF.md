# WATS – Project Brief

## Project goal

**WATS** is a multi-vendor e-commerce platform for Tanzania, with:

- **Customer mobile app** (Android & iOS)
- **Admin dashboard** (web)
- **Supabase backend**

---

## Key business model

| Term | Description |
|------|--------|
| **Vendors** | Add products to the system |
| **WATS (Operator)** | Owns inventory, warehouse, fulfillment, shipping and returns |
| **Payments** | Mobile money first, by phone number |
| **UI direction** | Premium, calm, trustworthy, Korean minimal-inspired |

---

## Core requirements (non-negotiable)

### Tech stack
- **Mobile:** React Native (Expo) + TypeScript  
- **Admin:** React + Vite + TypeScript + Tailwind + Shadcn/UI  
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS, Edge Functions)  
- **Payments:** M-Pesa, Mixx by Yas, HaloPesa, Airtel Money  

### Market
- **Country:** Tanzania  
- **Currency:** TZS  
- **Languages:** Swahili and English  

### Auth & users
- Sign-up with **phone number + OTP**
- Phone number is the **primary identifier**
- No re-entering phone at checkout (taken from profile)
- **Roles:** `customer` | `vendor` | `admin`  

### Payment system (critical)
- Payments are initiated **server-side only**
- Phone number is taken from **profile** without re-entry
- Flow: **STK Push / Payment Prompt**
- Provider webhooks: **signature-verified**
- **Idempotency** is used (no double payment per order)
- No storing card data

### Multi-vendor and central fulfillment
- Vendors add products
- **Operator (WATS)** manages: inventory, warehouse, picking, packing, shipping, returns
- Vendors get: sales reports, commission, payout schedules

---

## Customer app – features

- Browse and search products  
- Cart and checkout  
- Mobile payment (one-tap, STK)  
- Order tracking  
- Wishlist  
- Notifications  
- Loyalty points  
- BNPL (Buy Now Pay Later)  
- Livestream shopping  

---

## Admin dashboard – features

- Dashboard (KPIs)  
- Products and categories (CRUD)  
- Inventory management  
- Orders and shipping  
- Vendors (onboarding, reports)  
- Payment tracking  
- Payouts and reports  

---

## Deliverables (work order)

1. **Documentation first** (this – discuss and document)  
2. **Database:** SQL schema + migrations + RLS  
3. **Edge Functions:** Checkout & payment initiation + Payment webhook (M-Pesa example)  
4. **React Native:** Checkout and payment flow screens  
5. **Design:** Figma design system and tokens (React Native & Tailwind)  
6. **Admin dashboard:** Scaffold and main pages  
7. **API spec:** Full REST + auth + roles contract  
8. **Tests:** Unit and integration (payment, order → fulfillment)  
9. **Deployment guide:** CI/CD, env vars, Supabase, Vercel/Netlify, EAS  

This document is the **basis for discussion**: everything built will refer back to this and other docs.
