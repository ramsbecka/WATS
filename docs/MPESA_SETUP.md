# M-Pesa Payment Setup Guide

## Overview
Mfumo huu unatumia M-Pesa STK Push API kwa malipo. Mfumo unatumia Supabase Edge Functions kwa backend.

## 1. Register M-Pesa Developer Account

1. Nenda: https://developer.safaricom.co.ke
2. Create account
3. Create App
4. Chagua: **Lipa Na M-Pesa Online (STK Push)**

## 2. Pata Credentials

Baada ya ku-create app, utapata:

- **Consumer Key**
- **Consumer Secret**
- **Shortcode** (Business Short Code)
- **Passkey** (Lipa Na M-Pesa Online Passkey)

## 3. Setup Supabase Edge Functions Secrets

Nenda Supabase Dashboard → Settings → Edge Functions → Secrets

Ongeza secrets zifuatazo:

```bash
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENV=sandbox  # au 'production' kwa production
MPESA_CALLBACK_URL=https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook
PAYMENT_WEBHOOK_SECRET=your_webhook_secret  # optional, kwa signature verification
```

## 4. Configure Callback URL

1. Nenda M-Pesa Developer Portal
2. Configure Callback URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/payment-webhook
   ```
3. Hakikisha URL ina-respond na status 200

## 5. Test Sandbox

Kwa sandbox testing:

- Use test phone numbers (kama 254708374149)
- Use test amounts
- Sandbox URL: `https://sandbox.safaricom.co.ke`

## 6. Production Setup

Wakati wa ku-move kwa production:

1. Update `MPESA_ENV=sandbox` → `MPESA_ENV=production`
2. Update callback URL kwa production domain
3. Use production credentials
4. Production URL: `https://api.safaricom.co.ke`

## 7. Payment Flow

1. **User initiates checkout** → Mobile app calls `checkout-initiate` Edge Function
2. **Edge Function**:
   - Creates order
   - Creates payment record
   - Gets M-Pesa access token
   - Sends STK Push request
   - Saves checkoutRequestID
3. **User receives STK Push** on phone
4. **User enters PIN** → Payment processed
5. **M-Pesa sends callback** → `payment-webhook` Edge Function
6. **Webhook updates**:
   - Payment status (completed/failed)
   - Order status (confirmed if payment successful)
   - Creates shipment record
   - Sends notification to user

## 8. Environment Variables Summary

### Edge Functions (Supabase Secrets)
```
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
MPESA_ENV (sandbox/production)
MPESA_CALLBACK_URL
PAYMENT_WEBHOOK_SECRET (optional)
```

### Mobile App (.env)
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Admin App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 9. Troubleshooting

### STK Push haifanyi kazi
- Check credentials ziko sahihi
- Check callback URL ina-respond
- Check phone number format (255XXXXXXXXX)
- Check sandbox vs production environment

### Callback haifanyi kazi
- Verify callback URL ina-respond na 200
- Check webhook signature (kama configured)
- Check Supabase logs kwa errors

### Payment status haibadiliki
- Check payment-webhook function logs
- Verify payment record ina-provider_reference
- Check order_id ina-match

## 10. Security Notes

⚠️ **MUHIMU:**
- **Usiweke credentials kwenye client code**
- **Tumia Edge Functions kwa M-Pesa API calls**
- **Tumia service role key backend tu**
- **Verify webhook signatures kwa production**
- **Tumia HTTPS tu**

## 11. API Endpoints

### Checkout Initiate
```
POST /functions/v1/checkout-initiate
Headers:
  Authorization: Bearer <user_token>
  x-idempotency-key: <unique_key>
Body:
  {
    shipping_address: {...},
    payment_provider: "mpesa"
  }
```

### Payment Webhook (M-Pesa Callback)
```
POST /functions/v1/payment-webhook
Headers:
  x-provider-signature: <signature> (optional)
Body: M-Pesa callback JSON
```

## 12. Database Tables

### payments
- `id`: UUID
- `order_id`: UUID (FK to orders)
- `provider`: payment_provider enum ('mpesa', etc.)
- `status`: payment_status enum ('pending', 'initiated', 'completed', 'failed')
- `amount_tzs`: DECIMAL
- `provider_reference`: TEXT (CheckoutRequestID)
- `provider_callback`: JSONB (callback data)
- `idempotency_key`: TEXT UNIQUE

### orders
- Auto-updated to 'confirmed' wakati payment ina-complete

## 13. Testing Checklist

- [ ] Sandbox credentials configured
- [ ] Callback URL configured
- [ ] Test STK Push received on phone
- [ ] Payment completes successfully
- [ ] Order status updates to 'confirmed'
- [ ] Shipment record created
- [ ] Notification sent to user
- [ ] Payment status updates in real-time
