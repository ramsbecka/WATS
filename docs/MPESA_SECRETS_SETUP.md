# M-Pesa Edge Functions Secrets Setup Guide

Hii ni mwongozo kamili wa jinsi ya kuweka secrets kwenye Supabase Edge Functions ili mfumo wa malipo ya M-Pesa ufanikiwe.

---

## 📋 Orodha ya Secrets Zinazohitajika

Kwa mfumo wa M-Pesa kufanya kazi, unahitaji kuweka secrets zifuatazo kwenye Supabase Dashboard:

### 1. **MPESA_CONSUMER_KEY** ✅ REQUIRED
- **Kusudi:** Authentication key kutoka M-Pesa Developer Portal
- **Jinsi ya kupata:**
  1. Nenda https://developer.safaricom.co.ke
  2. Login kwa account yako
  3. Nenda kwenye "My Apps"
  4. Chagua app yako au create app mpya
  5. Chagua "Lipa Na M-Pesa Online (STK Push)"
  6. Copy **Consumer Key** kutoka app details

**Mfano:**
```
MPESA_CONSUMER_KEY=abc123xyz456def789uvw012
```

---

### 2. **MPESA_CONSUMER_SECRET** ✅ REQUIRED
- **Kusudi:** Secret key ya authentication kutoka M-Pesa Developer Portal
- **Jinsi ya kupata:**
  1. Kwenye app yako kwenye M-Pesa Developer Portal
  2. Copy **Consumer Secret** (kawaida inaonekana baada ya kubofya "Show Secret")

**Mfano:**
```
MPESA_CONSUMER_SECRET=def789uvw012ghi345jkl678
```

---

### 3. **MPESA_SHORTCODE** ✅ REQUIRED
- **Kusudi:** Business Short Code yako kutoka M-Pesa
- **Jinsi ya kupata:**
  1. Kwenye M-Pesa Developer Portal, kwenye app yako
  2. Tafuta **Business Short Code** au **Shortcode**
  3. Kwa sandbox: kawaida ni `174379`
  4. Kwa production: ni nambari yako ya PayBill/Till Number

**Mfano (Sandbox):**
```
MPESA_SHORTCODE=174379
```

**Mfano (Production):**
```
MPESA_SHORTCODE=123456
```

---

### 4. **MPESA_PASSKEY** ✅ REQUIRED
- **Kusudi:** Lipa Na M-Pesa Online Passkey
- **Jinsi ya kupata:**
  1. Kwenye M-Pesa Developer Portal, kwenye app yako
  2. Tafuta sehemu ya **"Lipa Na M-Pesa Online"**
  3. Copy **Passkey** (kawaida ni string ndefu ya alphanumeric)

**Mfano:**
```
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e5c893059b10f78e6b72ada1ed2c919
```

---

### 5. **MPESA_ENV** ✅ REQUIRED
- **Kusudi:** Kuamua kama unatumia sandbox au production environment
- **Maadili yanayoruhusiwa:**
  - `sandbox` - Kwa testing na development
  - `production` - Kwa production environment

**Mfano (Sandbox):**
```
MPESA_ENV=sandbox
```

**Mfano (Production):**
```
MPESA_ENV=production
```

---

### 6. **MPESA_CALLBACK_URL** ✅ REQUIRED
- **Kusudi:** URL ambayo M-Pesa inatumia kurudisha payment status (webhook)
- **Jinsi ya kuunda:**
  1. Pata Project ID yako kutoka Supabase Dashboard
  2. URL itakuwa: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook`
  3. Badilisha `YOUR_PROJECT_ID` na Project ID yako halisi

**Mfano:**
```
MPESA_CALLBACK_URL=https://tdvjdwgfnddytpzwzznt.supabase.co/functions/v1/payment-webhook
```

**Muhimu:** 
- Hakikisha URL hii ina-respond na status 200
- URL lazima iwe publicly accessible (M-Pesa ina-access kutoka internet)
- Kwa sandbox, unaweza kutumia ngrok au public URL kwa testing

---

### 7. **PAYMENT_WEBHOOK_SECRET** ⚠️ OPTIONAL (Lakini inapendekezwa)
- **Kusudi:** Secret kwa ku-verify webhook signatures kutoka M-Pesa (security)
- **Jinsi ya kuunda:**
  1. Generate random string ya angalau characters 32
  2. Unaweza kutumia online generator au command:
     ```bash
     openssl rand -base64 32
     ```

**Mfano:**
```
PAYMENT_WEBHOOK_SECRET=your_random_secret_string_here_min_32_chars
```

**Muhimu:**
- Hii ni optional lakini inapendekezwa kwa production
- Inasaidia ku-verify kuwa webhook requests zinatoka M-Pesa halisi

---

## 🚀 Jinsi ya Kuweka Secrets kwenye Supabase

### Njia ya 1: Supabase Dashboard (Recommended)

1. **Nenda Supabase Dashboard**
   - Login kwa https://app.supabase.com
   - Chagua project yako

2. **Nenda kwenye Edge Functions Settings**
   - Click **Settings** (icon ya gear) kwenye sidebar
   - Chagua **Edge Functions** kwenye menu
   - Scroll chini hadi **Secrets** section

3. **Ongeza kila secret**
   - Click **Add new secret**
   - Ingiza **Name** (kama `MPESA_CONSUMER_KEY`)
   - Ingiza **Value** (value halisi kutoka M-Pesa Portal)
   - Click **Save**
   - Rudia kwa kila secret

4. **Hakikisha zote zimewekwa:**
   - ✅ MPESA_CONSUMER_KEY
   - ✅ MPESA_CONSUMER_SECRET
   - ✅ MPESA_SHORTCODE
   - ✅ MPESA_PASSKEY
   - ✅ MPESA_ENV
   - ✅ MPESA_CALLBACK_URL
   - ⚠️ PAYMENT_WEBHOOK_SECRET (optional)

---

### Njia ya 2: Supabase CLI

Unaweza pia kuweka secrets kwa kutumia Supabase CLI:

```bash
# Install Supabase CLI kama bado hujai-install
npm install -g supabase

# Login kwa Supabase
supabase login

# Link project yako
supabase link --project-ref YOUR_PROJECT_ID

# Set secrets
supabase secrets set MPESA_CONSUMER_KEY="your_consumer_key_here"
supabase secrets set MPESA_CONSUMER_SECRET="your_consumer_secret_here"
supabase secrets set MPESA_SHORTCODE="your_shortcode_here"
supabase secrets set MPESA_PASSKEY="your_passkey_here"
supabase secrets set MPESA_ENV="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook"
supabase secrets set PAYMENT_WEBHOOK_SECRET="your_webhook_secret_here"
```

---

## ✅ Verification Checklist

Kabla ya ku-test malipo, hakikisha:

- [ ] **MPESA_CONSUMER_KEY** imewekwa na ni sahihi
- [ ] **MPESA_CONSUMER_SECRET** imewekwa na ni sahihi
- [ ] **MPESA_SHORTCODE** imewekwa na ni sahihi
- [ ] **MPESA_PASSKEY** imewekwa na ni sahihi
- [ ] **MPESA_ENV** imewekwa (`sandbox` au `production`)
- [ ] **MPESA_CALLBACK_URL** imewekwa na ina Project ID sahihi
- [ ] **PAYMENT_WEBHOOK_SECRET** imewekwa (optional lakini recommended)
- [ ] Callback URL ina-respond na status 200 (test kwa Postman/curl)
- [ ] Kwa sandbox: unatumia test phone numbers (kama `254708374149`)
- [ ] Kwa production: credentials zako ni za production environment

---

## 🧪 Testing Secrets

Baada ya kuweka secrets, unaweza ku-test kama zinafanya kazi:

### Test 1: Check Edge Function Logs
1. Nenda Supabase Dashboard → Edge Functions → Logs
2. Fanya test payment
3. Angalia logs kwa errors kuhusu missing secrets

### Test 2: Test STK Push
1. Fanya test checkout kutoka mobile app
2. Hakikisha STK Push inatumwa kwenye simu yako
3. Angalia payment status inasasishwa

### Test 3: Test Webhook
Unaweza ku-test webhook manually kwa kutumia curl:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "test-123",
        "CheckoutRequestID": "test-456",
        "ResultCode": 0,
        "ResultDesc": "Success"
      }
    }
  }'
```

---

## 🔒 Security Best Practices

1. **Never commit secrets kwenye code**
   - Usiweke secrets kwenye `.env` files zisizo na `.gitignore`
   - Usiweke secrets kwenye GitHub/GitLab

2. **Use different secrets kwa sandbox na production**
   - Sandbox secrets: kwa testing tu
   - Production secrets: kwa live environment

3. **Rotate secrets mara kwa mara**
   - Badilisha secrets kila baada ya muda (kama kila mwaka)
   - Update zote kwenye Supabase Dashboard

4. **Monitor webhook access**
   - Angalia logs kwa suspicious activity
   - Verify webhook signatures kwa production

5. **Limit access kwa secrets**
   - Watu wachache tu wanaweza ku-access Supabase Dashboard
   - Tumia environment-specific secrets

---

## 📝 Mfano wa Configuration

### Sandbox Configuration
```
MPESA_CONSUMER_KEY=abc123xyz456def789uvw012
MPESA_CONSUMER_SECRET=def789uvw012ghi345jkl678
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e5c893059b10f78e6b72ada1ed2c919
MPESA_ENV=sandbox
MPESA_CALLBACK_URL=https://tdvjdwgfnddytpzwzznt.supabase.co/functions/v1/payment-webhook
PAYMENT_WEBHOOK_SECRET=your_random_secret_here
```

### Production Configuration
```
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_ENV=production
MPESA_CALLBACK_URL=https://your-project.supabase.co/functions/v1/payment-webhook
PAYMENT_WEBHOOK_SECRET=your_production_webhook_secret
```

---

## 🆘 Troubleshooting

### Problem: "M-Pesa auth failed"
**Solution:** 
- Hakikisha `MPESA_CONSUMER_KEY` na `MPESA_CONSUMER_SECRET` ni sahihi
- Angalia kama credentials zako zina-expire

### Problem: "STK Push failed"
**Solution:**
- Hakikisha `MPESA_SHORTCODE` na `MPESA_PASSKEY` ni sahihi
- Angalia phone number format (lazima iwe `255712345678`)
- Hakikisha `MPESA_ENV` imewekwa sawa

### Problem: "Webhook not receiving callbacks"
**Solution:**
- Hakikisha `MPESA_CALLBACK_URL` ni sahihi na publicly accessible
- Test URL kwa curl/Postman
- Angalia kama URL ina-respond na status 200

### Problem: "Invalid signature"
**Solution:**
- Hakikisha `PAYMENT_WEBHOOK_SECRET` imewekwa sawa
- Verify signature verification logic kwenye webhook function

---

## 📚 Resources

- [M-Pesa Developer Portal](https://developer.safaricom.co.ke)
- [M-Pesa Daraja API Documentation](https://developer.safaricom.co.ke/docs)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)

---

## 💡 Notes

- **Sandbox vs Production:** Hakikisha unatumia credentials za sahihi environment
- **Phone Numbers:** Kwa sandbox, tumia test numbers (kama `254708374149`)
- **Callback URL:** Lazima iwe publicly accessible na ina-respond na status 200
- **Secrets Update:** Baada ya ku-update secrets, Edge Functions zina-restart automatically
- **Testing:** Test kila kitu kwa sandbox kabla ya ku-move kwa production

---

**Hitimisho:** Fuata mwongozo huu kwa makini, na malipo ya M-Pesa yatafanikiwa. Ikiwa una matatizo, angalia logs kwenye Supabase Dashboard na verify kuwa secrets zote zimewekwa sawa.
