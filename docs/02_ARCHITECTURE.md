# WATS – Architecture (System approach)

This is the **discussion document** for the system: approach, components and data flow. It is not code; it describes design decisions.

---

## System overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Customer App   │     │  Admin Dashboard │     │ Payment Provider │
│  (Expo / RN)    │     │  (React + Vite)  │     │ (M-Pesa, Airtel) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  HTTPS / JWT           │  HTTPS / JWT           │  Webhook
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Auth        │  │ PostgreSQL  │  │ Edge Functions              │  │
│  │ (Phone OTP) │  │ + RLS       │  │ - checkout-initiate         │  │
│  │             │  │             │  │ - payment-webhook            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
│                              │                                       │
│  ┌─────────────┐             │  Storage (product images, etc.)       │
│  │ Realtime    │             │                                       │
│  │ (optional)  │             │                                       │
│  └─────────────┘             │                                       │
└─────────────────────────────────────────────────────────────────────┘
```

- **Customers and Admin** use HTTPS and JWT (Supabase Auth).  
- **Payments** are initiated by the server (Edge Function); the provider returns results via **webhook**.

---

## Auth flow

1. User enters **phone number** → OTP is sent (Supabase Phone + Twilio or provider).  
2. User enters **OTP** → session is created; profile (and phone) is created/updated.  
3. **Phone** stays on profile; checkout does not ask for phone again.  
4. **Roles:** `customer` | `vendor` | `admin` – on `profiles` and enforced in RLS and Edge Functions.

---

## Payment flow (critical)

| Step | Action |
|------|--------|
| 1 | Customer taps “Pay” (checkout). |
| 2 | Client calls **Edge Function** (checkout-initiate) with: address, idempotency key. |
| 3 | Edge Function: validates cart, creates **order** (pending) and **payment** (pending), uses **phone from profile**. |
| 4 | Edge Function sends **STK Push** to provider (M-Pesa / Airtel / etc.). |
| 5 | Provider calls **webhook** on Edge Function (payment-webhook). |
| 6 | Webhook verifies **signature**, updates payment and order, adds notification and audit log. |
| 7 | Fulfillment and notifications can start (for confirmed order). |

**Principles:** Payments server-side only; idempotency; no card data stored; webhooks are signed.

---

## Database – approach (not SQL yet)

- **PostgreSQL (Supabase)** – main data.  
- **Main tables:** profiles, vendors, categories, products, product_images, inventory, carts, cart_items, orders, order_items, payments, shipments, fulfillment_centers, returns, loyalty_points, bnpl_orders, livestream_sessions, notifications, audit_logs.  
- **RLS:** Each table with sensitive data has policies: user sees/writes own data; vendor sees own products and reports; admin sees all; payments and orders – owner and admin only.  
- **Indices and FKs:** To be specified in Database Spec (schema design) before writing migrations.

---

## Edge Functions – role

| Function | Role |
|----------|--------|
| **checkout-initiate** | Validate cart, create order + payment, trigger STK Push, handle idempotency key. |
| **payment-webhook** | Verify signature/HMAC, update payment + order, notifications, audit log. |

**Provider adapters:** M-Pesa, Airtel, Mixx, HaloPesa – differences can be hidden in adapters (each provider has its adapter) so webhook and STK logic stay unified.

---

## Security – approach

- HTTPS everywhere.  
- Secrets (API keys, webhook secrets) in env vars – not in code.  
- Webhook: signature validation (HMAC-SHA256 or whatever the provider uses).  
- Supabase: anon key for client; **service role** for Edge Functions only (server-side).  
- Phone numbers in UI: **masked** (e.g. 255****5678).  
- Audit logs for payments and payouts.

---

## Observability and deployment – approach

- **Tests:** Unit for payment flows; integration for order → payment → fulfillment.  
- **Errors:** Error tracking (e.g. Sentry).  
- **Metrics:** Payment success rate, orders/day, fulfillment time; alerts for anomalies.  
- **CI/CD:** GitHub Actions; Supabase migrations + Edge deploy; Admin → Vercel/Netlify.  
- **Env vars:** Documented in Deployment guide and .env.example.

---

This architecture doc is for **discussion** and to confirm the approach before writing the actual schema, Edge Functions, and apps.
