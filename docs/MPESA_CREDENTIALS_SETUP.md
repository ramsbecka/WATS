# How to Set Up M-Pesa Credentials

## 📋 List of Required Credentials

### ⚠️ IMPORTANT: You must set ALL of these!

**Consumer Key and Consumer Secret alone are not enough!** The system needs all of the following credentials:

**From M-Pesa Developer Portal:**
1. **Consumer Key** ✅ REQUIRED
2. **Consumer Secret** ✅ REQUIRED
3. **Shortcode** (Business Short Code) ✅ REQUIRED
4. **Passkey** (Lipa Na M-Pesa Online Passkey) ✅ REQUIRED

**From your Supabase Project:**
5. **MPESA_ENV** ✅ REQUIRED (sandbox or production)
6. **MPESA_CALLBACK_URL** ✅ REQUIRED (your webhook URL)

**Optional (for security):**
7. **PAYMENT_WEBHOOK_SECRET** ⚪ OPTIONAL (for signature verification only)

---

## 🔐 Steps to Set Credentials

### Step 1: Get Credentials from M-Pesa Developer Portal

1. Go to: https://developer.safaricom.co.ke
2. Log in or Create Account
3. Go to **My Apps**
4. Create a new App or select your app
5. Select **"Lipa Na M-Pesa Online (STK Push)"**
6. Copy all credentials:
   - Consumer Key
   - Consumer Secret
   - Shortcode
   - Passkey

### Step 2: Set Credentials in Supabase Dashboard

#### Method A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Select your project**

3. **Go to Edge Functions Secrets:**
   - Click **Settings** (gear icon) in the left sidebar
   - Select **Edge Functions** (under "Project Settings")
   - Click the **Secrets** tab

   Or go directly to:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
   ```

4. **Add the following secrets (ALL REQUIRED):**

   ⚠️ **IMPORTANT:** You must set ALL of these secrets, not just Consumer Key and Consumer Secret!

   Click **"Add new secret"** and add each one:

   **1. MPESA_CONSUMER_KEY** ✅ REQUIRED
   ```
   Name: MPESA_CONSUMER_KEY
   Value: [Your Consumer Key from M-Pesa Portal]
   ```

   **2. MPESA_CONSUMER_SECRET** ✅ REQUIRED
   ```
   Name: MPESA_CONSUMER_SECRET
   Value: [Your Consumer Secret from M-Pesa Portal]
   ```

   **3. MPESA_SHORTCODE** ✅ REQUIRED
   ```
   Name: MPESA_SHORTCODE
   Value: [Your shortcode, e.g.: 174379]
   ```
   (This is your Business Short Code from M-Pesa Portal)

   **4. MPESA_PASSKEY** ✅ REQUIRED
   ```
   Name: MPESA_PASSKEY
   Value: [Your Passkey from M-Pesa Portal]
   ```
   (This is the "Lipa Na M-Pesa Online Passkey" from M-Pesa Portal)

   **5. MPESA_ENV** ✅ REQUIRED
   ```
   Name: MPESA_ENV
   Value: sandbox
   ```
   (For production, change to `production`)

   **6. MPESA_CALLBACK_URL** ✅ REQUIRED
   ```
   Name: MPESA_CALLBACK_URL
   Value: https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook
   ```
   (Replace `YOUR_PROJECT_ID` with your Supabase Project ID)

   **7. PAYMENT_WEBHOOK_SECRET** ⚪ OPTIONAL
   ```
   Name: PAYMENT_WEBHOOK_SECRET
   Value: [optional secret for signature verification]
   ```
   (This is optional; you can leave it for now)

#### Method B: Via Supabase CLI

If you use Supabase CLI, run these commands:

```bash
# Go to project directory
cd /path/to/your/project

# Link project (first time only)
supabase link --project-ref YOUR_PROJECT_ID

# Set secrets
supabase secrets set MPESA_CONSUMER_KEY="your_consumer_key_here"
supabase secrets set MPESA_CONSUMER_SECRET="your_consumer_secret_here"
supabase secrets set MPESA_SHORTCODE="your_shortcode_here"
supabase secrets set MPESA_PASSKEY="your_passkey_here"
supabase secrets set MPESA_ENV="sandbox"
supabase secrets set MPESA_CALLBACK_URL="https://YOUR_PROJECT_ID.supabase.co/functions/v1/payment-webhook"

# Verify secrets are set
supabase secrets list
```

---

## ✅ Verify Credentials Are Set Correctly

After setting credentials, ensure:

1. **All 6 are set (REQUIRED):**
   - ✅ MPESA_CONSUMER_KEY
   - ✅ MPESA_CONSUMER_SECRET
   - ✅ MPESA_SHORTCODE
   - ✅ MPESA_PASSKEY
   - ✅ MPESA_ENV
   - ✅ MPESA_CALLBACK_URL
   
   ⚠️ **Remember:** Consumer Key and Consumer Secret alone are not enough! You must set all 6.

2. **MPESA_ENV** is set to `sandbox` for testing or `production` for production
3. **MPESA_CALLBACK_URL** has your correct Project ID
4. **No spaces** at the start or end of values
5. **PAYMENT_WEBHOOK_SECRET** is optional (you can leave it for now)

---

## 🧪 Test Credentials

After setting credentials:

1. **Deploy Edge Functions** (if not already deployed):
   ```bash
   supabase functions deploy checkout-initiate
   supabase functions deploy payment-webhook
   ```

2. **Test with mobile app:**
   - Open the mobile app
   - Add products to cart
   - Proceed to checkout
   - Enter phone number (for sandbox: `254708374149`)
   - Submit payment
   - You should receive the STK Push prompt on your phone

---

## 🔍 Troubleshooting

### Credentials not working?

1. **Check Supabase Logs:**
   - Go to: Dashboard → Edge Functions → Logs
   - Look for errors about missing credentials

2. **Verify secrets exist:**
   ```bash
   supabase secrets list
   ```

3. **Check format:**
   - Ensure there are no extra quotes
   - Ensure no leading/trailing spaces
   - Ensure your Project ID is correct in the Callback URL

4. **Test access token:**
   - The Edge Function should obtain an access token from M-Pesa
   - If it fails, credentials may be wrong

### Sandbox vs Production

**Sandbox:**
- `MPESA_ENV=sandbox`
- Use test phone numbers
- Use sandbox credentials from Developer Portal

**Production:**
- `MPESA_ENV=production`
- Use real phone numbers
- Use production credentials
- Update Callback URL to production domain

---

## 📝 Credentials Format Example

### ⚠️ IMPORTANT: You must set all 6 of these secrets!

**For Sandbox (REQUIRED - set all):**
```
MPESA_CONSUMER_KEY=abc123xyz456                    ✅ REQUIRED
MPESA_CONSUMER_SECRET=def789uvw012                 ✅ REQUIRED
MPESA_SHORTCODE=174379                             ✅ REQUIRED
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd...  ✅ REQUIRED
MPESA_ENV=sandbox                                  ✅ REQUIRED
MPESA_CALLBACK_URL=https://tdvjdwgfnddytpzwzznt.supabase.co/functions/v1/payment-webhook  ✅ REQUIRED
```

**For Production (REQUIRED - set all):**
```
MPESA_CONSUMER_KEY=your_production_consumer_key    ✅ REQUIRED
MPESA_CONSUMER_SECRET=your_production_consumer_secret  ✅ REQUIRED
MPESA_SHORTCODE=your_business_shortcode           ✅ REQUIRED
MPESA_PASSKEY=your_production_passkey              ✅ REQUIRED
MPESA_ENV=production                               ✅ REQUIRED
MPESA_CALLBACK_URL=https://your-project.supabase.co/functions/v1/payment-webhook  ✅ REQUIRED
```

**Optional (you can leave for now):**
```
PAYMENT_WEBHOOK_SECRET=your_optional_secret        ⚪ OPTIONAL
```

### Why must you set all of them?

- **Consumer Key & Secret:** For authentication with M-Pesa API
- **Shortcode:** Your Business Short Code (e.g. 174379)
- **Passkey:** For encryption of STK Push requests
- **ENV:** Tells the system whether you use sandbox or production
- **Callback URL:** M-Pesa uses this to return payment status

---

## ⚠️ Security Notes

1. **Do not put credentials in code files** (app .env files)
2. **Use Supabase Secrets only** for Edge Functions
3. **Do not share credentials** in public repositories
4. **Rotate credentials** regularly for security
5. **Use different credentials** for sandbox and production

---

## 📞 Support

If you have issues:
1. Check Supabase Edge Functions logs
2. Check M-Pesa Developer Portal for API status
3. Verify your credentials in M-Pesa Portal
4. Test in sandbox first before moving to production
