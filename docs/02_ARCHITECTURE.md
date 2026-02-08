# WATS – Architecture (Mbinu ya mfumo)

Hii ni **document ya mjadala** ya mfumo: mbinu, vifaa na mtiririko wa data. Si code; ni maelezo na maamuzi ya kubuni.

---

## Mchoro wa mfumo (System overview)

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

- **Wateja na Admin** wanatumia HTTPS na JWT (Supabase Auth).  
- **Malipo** yanaanzishwa na server (Edge Function); provider inarudisha matokeo kwenye **webhook**.

---

## Mfumo wa utambulisho (Auth flow)

1. Mtumiaji aingiza **nambari ya simu** → OTP inatumwa (Supabase Phone + Twilio au provider).  
2. Mtumiaji anaingiza **OTP** → session inaundwa; profile (na simu) inaundwa/isasishwe.  
3. **Simu** inabaki kwenye profile; checkout haihitaji kuingiza simu tena.  
4. **Roles:** `customer` | `vendor` | `admin` – kwenye `profiles` na kuthibitishwa kwenye RLS na Edge Functions.

---

## Mfumo wa malipo (Payment flow – critical)

| Hatua | Kitendo |
|-------|--------|
| 1 | Mteja anabonyeza “Lipa” (checkout). |
| 2 | Client anaitisha **Edge Function** (checkout-initiate) na: anwani, idempotency key. |
| 3 | Edge Function: inathibitisha cart, inaunda **order** (pending) na **payment** (pending), inatumia **simu kutoka profile**. |
| 4 | Edge Function inatuma **STK Push** kwa provider (M-Pesa / Airtel / n.k.). |
| 5 | Provider inatumia **webhook** kwenye Edge Function (payment-webhook). |
| 6 | Webhook inathibitisha **signature**, inasasisha payment na order, inaongeza notification na audit log. |
| 7 | Fulfillment na arifa zinaweza kuanza (kwa order iliyothibitishwa). |

**Kanuni:** Malipo server-side tu; idempotency; hakuna kuhifadhi data za kadi; webhook zina saini.

---

## Database – mbinu (si SQL bado)

- **PostgreSQL (Supabase)** – data kuu.  
- **Jedwali kuu:** profiles, vendors, categories, products, product_images, inventory, carts, cart_items, orders, order_items, payments, shipments, fulfillment_centers, returns, loyalty_points, bnpl_orders, livestream_sessions, notifications, audit_logs.  
- **RLS:** Kila jedwali lenye data nyeti kina policies: mtu anaona/kuandika data yake; vendor anaona bidhaa zake na ripoti; admin anaona kila kitu; payments na orders – owner na admin tu.  
- **Indices na FKs:** Zitaainishwa kwenye Database Spec (schema design) kabla ya kuandika migrations.

---

## Edge Functions – jukumu

| Function | Jukumu |
|----------|--------|
| **checkout-initiate** | Validate cart, create order + payment, trigger STK Push, handle idempotency key. |
| **payment-webhook** | Verify signature/HMAC, update payment + order, notifications, audit log. |

**Provider adapters:** M-Pesa, Airtel, Mixx, HaloPesa – tofauti zinaweza kufichwa kwenye adapters (kila provider ina adapter yake) ili webhook na STK logic iwe moja kwa mtiririko.

---

## Usalama (Security – mbinu)

- HTTPS kila mahali.  
- Siri (API keys, webhook secrets) kwenye env vars – si kwenye code.  
- Webhook: validation ya signature (HMAC-SHA256 au kile provider inatumia).  
- Supabase: anon key kwa client; **service role** kwa Edge Functions tu (server-side).  
- Nambari za simu kwenye UI: **mask** (e.g. 255****5678).  
- Audit logs kwa malipo na payouts.

---

## Observability na deployment (mbinu)

- **Majaribio:** Unit kwa payment flows; integration kwa order → payment → fulfillment.  
- **Makosa:** Error tracking (e.g. Sentry).  
- **Metrics:** Payment success rate, orders/day, fulfillment time; alerts kwa anomalies.  
- **CI/CD:** GitHub Actions; Supabase migrations + Edge deploy; Admin → Vercel/Netlify; Mobile → Expo EAS.  
- **Env vars:** Zitaandikwa kwenye Deployment guide na .env.example.

---

Hii architecture doc inatumika kwa **kujadili** na kuthibitisha mbinu kabla ya kuandika schema halisi, Edge Functions, na apps.
