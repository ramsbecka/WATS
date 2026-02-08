# WATS – Project Brief

## Lengo la mradi (Project goal)

Kusimamia **WATS**: jukwaa la e-commerce la wanunuzi wengi (multi-vendor) linalotumika Tanzania, lenye:

- **Programu ya simu ya wateja** (Android & iOS)
- **Dashibodi ya Admin** (wavuti)
- **Backend ya Supabase**

---

## Modeli ya biashara (Key business model)

| Neno | Maelezo |
|------|--------|
| **Wauzaji (Vendors)** | Wanaingiza bidhaa kwenye mfumo |
| **WATS (Operator)** | Inamiliki inventory, ghala, utekelezaji (fulfillment), usafirishaji na kurudisha bidhaa |
| **Malipo** | Kwanza pesa za simu (mobile money), kwa nambari ya simu |
| **Mtazamo wa UI** | Premium, utulivu, wa kuaminika, ulioinspirishwa na Korean minimal |

---

## Mahitaji ya msingi (Core requirements – non-negotiable)

### Tech stack
- **Simu:** React Native (Expo) + TypeScript  
- **Admin:** React + Vite + TypeScript + Tailwind + Shadcn/UI  
- **Backend:** Supabase (Auth, PostgreSQL, Storage, RLS, Edge Functions)  
- **Malipo:** M-Pesa, Mixx by Yas, HaloPesa, Airtel Money  

### Soko
- **Nchi:** Tanzania  
- **Sarafu:** TZS  
- **Lugha:** Kiswahili na Kiingereza  

### Utambulisho na watumiaji (Auth & users)
- Usajili na **nambari ya simu + OTP**
- Nambari ya simu ni **kitambulisho cha msingi**
- Hakuna kuingiza simu tena wakati wa checkout (inatumika kutoka profile)
- **Majukumu:** `customer` | `vendor` | `admin`  

### Mfumo wa malipo (critical)
- Malipo yanaanzishwa **server-side tu**
- Nambari ya simu inatumika kutoka **profile** bila kuingiza tena
- Mwendo: **STK Push / Payment Prompt**
- Webhook za provider: **zina thibitishwa kwa saini (signature)**
- **Idempotency** inatumika (hakuna malipo mara mbili kwa order moja)
- Hakuna kuhifadhi data za kadi

### Multi-vendor na utekelezaji wa kati
- Wauzaji wanaingiza bidhaa
- **Operator (WATS)** inasimamia: inventory, ghala, picking, packing, usafirishaji, returns
- Wauzaji wanapata: ripoti za mauzo, commission, ratiba za malipo (payouts)

---

## Kazi za wateja (Customer app – features)

- Kuangalia na kutafuta bidhaa  
- Cart na checkout  
- Malipo kwa simu (one-tap, STK)  
- Ufuatiliaji wa order  
- Wishlist  
- Arifa (notifications)  
- Pointi za loyalty  
- BNPL (Buy Now Pay Later)  
- Ununuzi wa livestream  

---

## Kazi za Admin (Admin dashboard – features)

- Dashboard (KPIs)  
- Bidhaa na makundi (CRUD)  
- Usimamizi wa inventory  
- Maagizo na usafirishaji  
- Wauzaji (onboarding, ripoti)  
- Ufuatiliaji wa malipo  
- Payouts na ripoti  

---

## Matoleo yanayotarajiwa (Deliverables – order ya kazi)

1. **Documentation kwanza** (hii – tujadili na kudocuments)  
2. **Database:** SQL schema + migrations + RLS  
3. **Edge Functions:** Checkout & payment initiation + Payment webhook (M-Pesa mfano)  
4. **React Native:** Screens za checkout na payment flow  
5. **Design:** Figma design system na tokens (React Native & Tailwind)  
6. **Admin dashboard:** Scaffold na kurasa kuu  
7. **API spec:** Mkataba kamili wa REST + auth + roles  
8. **Majaribio:** Unit na integration (payment, order → fulfillment)  
9. **Deployment guide:** CI/CD, env vars, Supabase, Vercel/Netlify, EAS  

Hii document ni **msingi wa mjadala**: kila kitu kinachojengwa kitarejelea hapa na kwenye docs zingine.
