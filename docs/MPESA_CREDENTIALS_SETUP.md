# Jinsi ya Kuweka M-Pesa Credentials

## 📋 Orodha ya Credentials Unazohitaji

### ⚠️ MUHIMU: Lazima uweke ZOTE hizi!

**Consumer Key na Consumer Secret tu haitoshi!** Mfumo unahitaji credentials zote zifuatazo:

**Kutoka M-Pesa Developer Portal:**
1. **Consumer Key** ✅ REQUIRED
2. **Consumer Secret** ✅ REQUIRED
3. **Shortcode** (Business Short Code) ✅ REQUIRED
4. **Passkey** (Lipa Na M-Pesa Online Passkey) ✅ REQUIRED

**Kutoka Supabase Project yako:**
5. **MPESA_ENV** ✅ REQUIRED (sandbox au production)
6. **MPESA_CALLBACK_URL** ✅ REQUIRED (URL ya webhook yako)

**Optional (kwa security):**
7. **PAYMENT_WEBHOOK_SECRET** ⚪ OPTIONAL (kwa signature verification tu)

---

## 🔐 Hatua za Kuweka Credentials

### Hatua 1: Pata Credentials kutoka M-Pesa Developer Portal

1. Nenda: https://developer.safaricom.co.ke
2. Login au Create Account
3. Nenda kwenye **My Apps**
4. Create App mpya au chagua app yako
5. Chagua **"Lipa Na M-Pesa Online (STK Push)"**
6. Copy credentials zote:
   - Consumer Key
   - Consumer Secret
   - Shortcode
   - Passkey

### Hatua 2: Weka Credentials kwenye Supabase Dashboard

#### Njia A: Kwa Supabase Dashboard (Inapendekezwa)

1. **Fungua Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Chagua Project yako**

3. **Nenda kwenye Edge Functions Secrets:**
   - Click **Settings** (icon ya gear) kwenye sidebar ya kushoto
   - Chagua **Edge Functions** (chini ya "Project Settings")
   - Click tab **Secrets**

   Au nenda moja kwa moja:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
   ```

4. **Ongeza Secrets zifuatazo (LAZIMA ZOTE):**

   ⚠️ **MUHIMU:** Lazima uweke secrets ZOTE hizi, sio Consumer Key na Consumer Secret tu!

   Click button **"Add new secret"** na ongeza kila moja:

   **1. MPESA_CONSUMER_KEY** ✅ REQUIRED
   ```
   Name: MPESA_CONSUMER_KEY
   Value: [Consumer Key yako kutoka M-Pesa Portal]
   ```

   **2. MPESA_CONSUMER_SECRET** ✅ REQUIRED
   ```
   Name: MPESA_CONSUMER_SECRET
   Value: [Consumer Secret yako kutoka M-Pesa Portal]
   ```

   **3. MPESA_SHORTCODE** ✅ REQUIRED
   ```
   Name: MPESA_SHORTCODE
   Value: [Shortcode yako, kwa mfano: 174379]
   ```
   (Hii ni Business Short Code yako kutoka M-Pesa Portal)

   **4. MPESA_PASSKEY** ✅ REQUIRED
   ```
   Name: MPESA_PASSKEY
   Value: [Passkey yako kutoka M-Pesa Portal]
   ```
   (Hii ni "Lipa Na M-Pesa Online Passkey" kutoka M-Pesa Portal)

   **5. MPESA_ENV** ✅ REQUIRED
   ```
   Name: MPESA_ENV
   Value: sandbox
   ```
   (Kwa production, badilisha kuwa `production`)

   **6. MPESA_CALLBACK_URL** ✅ REQUIRED
   ```
   Name: MPESA_CALLBACK_URL
   Value: https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook
   ```
   (Badilisha `YOUR_PROJECT_ID` na Project ID yako ya Supabase)

   **7. PAYMENT_WEBHOOK_SECRET** ⚪ OPTIONAL
   ```
   Name: PAYMENT_WEBHOOK_SECRET
   Value: [optional secret kwa signature verification]
   ```
   (Hii ni optional tu, unaweza kuiacha kwa sasa)

#### Njia B: Kwa Supabase CLI

Ikiwa unatumia Supabase CLI, tumia commands hizi:

```bash
# Nenda kwenye project directory
cd /path/to/your/project

# Link project (kwa mara ya kwanza tu)
supabase link --project-ref YOUR_PROJECT_ID

# Weka secrets
supabase secrets set MPESA_CONSUMER_KEY="your_consumer_key_here"
supabase secrets set MPESA_CONSUMER_SECRET="your_consumer_secret_here"
supabase secrets set MPESA_SHORTCODE="your_shortcode_here"
supabase secrets set MPESA_PASSKEY="your_passkey_here"
supabase secrets set MPESA_ENV="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook"

# Hakikisha secrets zimewekwa
supabase secrets list
```

---

## ✅ Hakikisha Credentials Zimewekwa Sahihi

Baada ya kuweka credentials, hakikisha:

1. **Zote 6 zimewekwa (REQUIRED):**
   - ✅ MPESA_CONSUMER_KEY
   - ✅ MPESA_CONSUMER_SECRET
   - ✅ MPESA_SHORTCODE
   - ✅ MPESA_PASSKEY
   - ✅ MPESA_ENV
   - ✅ MPESA_CALLBACK_URL
   
   ⚠️ **Kumbuka:** Consumer Key na Consumer Secret tu haitoshi! Lazima uweke zote 6.

2. **MPESA_ENV** imewekwa `sandbox` kwa testing au `production` kwa production
3. **MPESA_CALLBACK_URL** ina Project ID yako sahihi
4. **Hakuna spaces** mwanzoni au mwishoni wa values
5. **PAYMENT_WEBHOOK_SECRET** ni optional tu (unaweza kuiacha kwa sasa)

---

## 🧪 Test Credentials

Baada ya kuweka credentials:

1. **Deploy Edge Functions** (ikiwa bado haujadeploy):
   ```bash
   supabase functions deploy checkout-initiate
   supabase functions deploy payment-webhook
   ```

2. **Test kwa mobile app:**
   - Fungua mobile app
   - Add products to cart
   - Proceed to checkout
   - Enter phone number (kwa sandbox: `254708374149`)
   - Submit payment
   - Unapaswa kupokea STK Push prompt kwenye simu

---

## 🔍 Troubleshooting

### Credentials hazifanyi kazi?

1. **Check Supabase Logs:**
   - Nenda: Dashboard → Edge Functions → Logs
   - Angalia kama kuna errors kuhusu missing credentials

2. **Verify Secrets ziko:**
   ```bash
   supabase secrets list
   ```

3. **Check Format:**
   - Hakikisha hakuna quotes zisizohitajika
   - Hakikisha hakuna spaces mwanzoni/mwishoni
   - Hakikisha Project ID yako sahihi kwenye Callback URL

4. **Test Access Token:**
   - Edge Function inapaswa kupata access token kutoka M-Pesa
   - Ikiwa haipati, credentials zinaweza kuwa wrong

### Sandbox vs Production

**Sandbox:**
- `MPESA_ENV=sandbox`
- Use test phone numbers
- Use sandbox credentials kutoka Developer Portal

**Production:**
- `MPESA_ENV=production`
- Use real phone numbers
- Use production credentials
- Update Callback URL kwa production domain

---

## 📝 Mfano wa Credentials Format

### ⚠️ MUHIMU: Lazima uweke ZOTE hizi 6 secrets!

**Kwa Sandbox (REQUIRED - lazima uweke zote):**
```
MPESA_CONSUMER_KEY=abc123xyz456                    ✅ REQUIRED
MPESA_CONSUMER_SECRET=def789uvw012                 ✅ REQUIRED
MPESA_SHORTCODE=174379                             ✅ REQUIRED
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd...  ✅ REQUIRED
MPESA_ENV=sandbox                                  ✅ REQUIRED
MPESA_CALLBACK_URL=https://tdvjdwgfnddytpzwzznt.supabase.co/functions/v1/payment-webhook  ✅ REQUIRED
```

**Kwa Production (REQUIRED - lazima uweke zote):**
```
MPESA_CONSUMER_KEY=your_production_consumer_key    ✅ REQUIRED
MPESA_CONSUMER_SECRET=your_production_consumer_secret  ✅ REQUIRED
MPESA_SHORTCODE=your_business_shortcode           ✅ REQUIRED
MPESA_PASSKEY=your_production_passkey              ✅ REQUIRED
MPESA_ENV=production                               ✅ REQUIRED
MPESA_CALLBACK_URL=https://your-project.supabase.co/functions/v1/payment-webhook  ✅ REQUIRED
```

**Optional (unaweza kuiacha kwa sasa):**
```
PAYMENT_WEBHOOK_SECRET=your_optional_secret        ⚪ OPTIONAL
```

### Kwa nini lazima uweke zote?

- **Consumer Key & Secret:** Kwa authentication na M-Pesa API
- **Shortcode:** Business Short Code yako (kama 174379)
- **Passkey:** Kwa encryption ya STK Push requests
- **ENV:** Kujua kama unatumia sandbox au production
- **Callback URL:** M-Pesa inatumia hii kwa kurudi payment status

---

## ⚠️ Security Notes

1. **Usiweke credentials kwenye code files** (.env files za apps)
2. **Tumia Supabase Secrets tu** kwa Edge Functions
3. **Usishare credentials** kwenye public repositories
4. **Rotate credentials** mara kwa mara kwa security
5. **Use different credentials** kwa sandbox na production

---

## 📞 Support

Ikiwa una shida:
1. Check Supabase Edge Functions logs
2. Check M-Pesa Developer Portal kwa API status
3. Verify credentials zako kwenye M-Pesa Portal
4. Test kwa sandbox kwanza kabla ya ku-move production
