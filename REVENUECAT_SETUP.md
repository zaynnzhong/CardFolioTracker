# RevenueCat Integration Guide

## Overview

Your app now integrates with RevenueCat for in-app purchases and subscriptions on iOS and Android. Users can purchase unlimited card access through the App Store or Play Store.

## Features Implemented

✅ RevenueCat SDK integrated
✅ Paywall UI with subscription packages
✅ Automatic initialization when user logs in
✅ Restore purchases functionality
✅ Fallback to unlock keys on web platform
✅ User attributes sync (email, display name)

## Setup Steps

### 1. Create RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up for a free account
3. Create a new project: "Prism Portfolio"

### 2. Configure iOS App

**In RevenueCat Dashboard:**
1. Go to **Projects** → **Your Project** → **Apps**
2. Click **+ New** → **iOS**
3. Enter:
   - **Bundle ID**: `com.prismcards.portfolio`
   - **App Name**: Prism Portfolio
4. Copy the **iOS API Key**

**In App Store Connect:**
1. Create in-app purchase products:
   - **Monthly**: `monthly` (e.g., $4.99/month)
   - **Yearly**: `yearly` (e.g., $39.99/year)
   - **Lifetime**: `lifetime` (e.g., $79.99 one-time)
2. Set up **Shared Secret** for subscription verification
3. Add the Shared Secret to RevenueCat

**Configure Auto-Renewable Subscription Group:**
1. Create subscription group: "Pro Access"
2. Add all subscription products to this group
3. Set billing grace period and other options

### 3. Configure Android App

**In RevenueCat Dashboard:**
1. Go to **Projects** → **Your Project** → **Apps**
2. Click **+ New** → **Android**
3. Enter:
   - **Package Name**: `com.prismcards.portfolio`
   - **App Name**: Prism Portfolio
4. Copy the **Android API Key**

**In Google Play Console:**
1. Create in-app products:
   - **Monthly**: `monthly` (e.g., $4.99/month)
   - **Yearly**: `yearly` (e.g., $39.99/year)
   - **Lifetime**: `lifetime` (e.g., $79.99 one-time)
2. Link Play Store account to RevenueCat:
   - Download service account JSON from Play Console
   - Upload to RevenueCat under **App Settings** → **Service Credentials**

### 4. Create Entitlements & Offerings

**Create "PRISM Cards Portfolio Pro" Entitlement:**
1. In RevenueCat Dashboard → **Entitlements**
2. Click **+ New Entitlement**
3. Identifier: `PRISM Cards Portfolio Pro`
4. Description: "Unlimited cards and premium features for PRISM Cards Portfolio"

**Create Offerings:**
1. Go to **Offerings**
2. Create a **Current** offering
3. Add packages:
   - **Monthly** package → Links to `monthly` product
   - **Yearly** package → Links to `yearly` product
   - **Lifetime** package → Links to `lifetime` product
4. Each package should grant the "PRISM Cards Portfolio Pro" entitlement

### 5. Add API Keys to Your App

The API keys are already configured in `.env.local`:

```env
# RevenueCat API Keys
VITE_REVENUECAT_API_KEY_IOS=test_yyyEOwwPxQpfisLpMNsNPeaxkCE
VITE_REVENUECAT_API_KEY_ANDROID=test_yyyEOwwPxQpfisLpMNsNPeaxkCE
```

**Security Note**: These keys are for the **client-side** SDK. They're safe to include in your app bundle. The secret API key (for server-side) should never be in the client app.

**Product Configuration**: The app is configured to use these product identifiers:
- `monthly` - Monthly subscription
- `yearly` - Yearly subscription
- `lifetime` - Lifetime purchase

**Entitlement**: The app checks for the `PRISM Cards Portfolio Pro` entitlement to grant unlimited access.

### 6. Configure Webhook (Optional but Recommended)

RevenueCat webhooks keep your database in sync with subscription status.

**In RevenueCat Dashboard:**
1. Go to **Integrations** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/revenuecat`
3. Select events to send:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`
   - `UNCANCELLATION`

**Webhook Handler** (to be implemented in `server/src/routes.ts`):

```typescript
router.post('/webhooks/revenuecat', async (req, res) => {
  const event = req.body.event;
  const userId = event?.app_user_id; // Firebase UID

  switch (event?.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
      // Grant pro access
      await upgradeUserToPro(userId);
      break;

    case 'CANCELLATION':
    case 'EXPIRATION':
      // Revoke pro access (if no unlock key or whitelist)
      await downgradeUser(userId);
      break;
  }

  res.status(200).json({ received: true });
});
```

## User Experience Flow

### On Native Apps (iOS/Android)

1. **User hits card limit** → Banner appears
2. **Clicks "Upgrade to Pro"** → Paywall modal shows
3. **Sees subscription options** (Monthly, Annual, Lifetime)
4. **Taps a package** → Native payment sheet appears
5. **Completes purchase** → Instantly unlocked
6. **App reloads** → No more limits

### On Web

1. **User hits card limit** → Banner appears
2. **Clicks "Unlock Unlimited"** → Modal shows
3. **Sees message** → "In-app purchases only on mobile"
4. **Option to enter unlock key** → Can redeem promotional key instead

## Testing

### Test on iOS Simulator

1. **Create Sandbox Tester**:
   - App Store Connect → Users and Access → Sandbox Testers
   - Add test Apple ID email
2. **Sign out of real Apple ID on device**
3. **Run app and test purchase**
4. **Sandbox tester will be prompted** for password
5. **Purchase completes without charging**

### Test on Android Emulator

1. **Add test account** in Google Play Console
2. **Use internal testing track** to test purchases
3. **Add your email** as internal tester
4. **Download from Play Console** test link
5. **Test purchases** (free for internal testers)

### Test Restore Purchases

1. **Make a test purchase**
2. **Delete and reinstall app**
3. **Tap "Restore Purchases"**
4. **Pro access should return**

## Pricing Strategy Examples

### Option 1: Freemium with Trial
```
Free: 30 cards
Monthly: $4.99/month (7-day free trial)
Annual: $39.99/year (save 33%)
```

### Option 2: One-Time Purchase
```
Free: 50 cards
Lifetime: $19.99 one-time
```

### Option 3: Tiered Subscriptions
```
Free: 30 cards
Basic: $2.99/month (100 cards)
Pro: $9.99/month (unlimited + premium features)
```

## RevenueCat Dashboard Features

### Analytics
- **MRR (Monthly Recurring Revenue)** tracking
- **Churn rate** monitoring
- **Active subscriptions** count
- **Trial conversion rate**

### Customer Management
- View individual customer subscriptions
- Manually grant/revoke entitlements
- Refund purchases
- View purchase history

### Experiments
- A/B test different pricing
- Test paywall variations
- Optimize conversion rates

## Troubleshooting

### "No offerings available"

**Cause**: Offerings not configured in RevenueCat Dashboard

**Fix**:
1. Go to RevenueCat → Offerings
2. Create "Current" offering
3. Add packages with correct product IDs
4. Ensure products exist in App Store Connect / Play Console

### "Purchase failed"

**Cause**: Product ID mismatch or incorrect credentials

**Fix**:
1. Verify product IDs match exactly in:
   - RevenueCat Dashboard
   - App Store Connect / Play Console
   - Your code
2. Check service credentials are uploaded
3. Ensure Shared Secret (iOS) is configured

### "Already purchased but not restored"

**Cause**: Different app user ID used

**Fix**:
1. RevenueCat uses the `appUserID` you set (Firebase UID)
2. Make sure same user ID is used across sessions
3. Call `restorePurchases()` to link purchases to current user

### Purchases not syncing to database

**Cause**: Webhook not configured or failing

**Fix**:
1. Verify webhook URL is correct
2. Check server logs for errors
3. Test webhook with RevenueCat's webhook tester
4. Ensure server can receive POST requests from RevenueCat IPs

## Security Best Practices

✅ **Do:**
- Use client-side API keys in the app
- Validate purchases server-side via webhooks
- Store subscription status in your database
- Implement receipt validation for sensitive operations

❌ **Don't:**
- Put secret API key in client app
- Trust client-side entitlement checks alone
- Skip webhook implementation
- Store payment details yourself

## Migration from Unlock Keys

Users who already purchased unlock keys keep their access:
- Unlock key status is checked first
- RevenueCat subscription is additional unlock method
- Both methods grant unlimited access
- Webhook won't downgrade users with unlock keys

## Revenue Sharing

**Apple App Store**: 30% fee (15% after 1st year per subscriber)
**Google Play Store**: 30% fee (15% after 1st year per subscriber)
**RevenueCat**: Free up to $10k MRR, then 1% of tracked revenue

**Example**:
- Price: $9.99/month
- Apple/Google takes: $3.00
- You receive: $6.99
- RevenueCat fee (above $10k MRR): $0.10
- **Net revenue**: $6.89/subscriber/month

## Next Steps

1. ✅ **Set up RevenueCat account** and configure apps
2. ✅ **Create in-app products** in App Store Connect / Play Console
3. ✅ **Add API keys** to `.env.local`
4. ✅ **Test purchases** with sandbox accounts
5. ✅ **Configure webhook** for production
6. ✅ **Monitor analytics** in RevenueCat Dashboard
7. ✅ **Optimize pricing** based on conversion data

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [iOS Subscription Setup Guide](https://docs.revenuecat.com/docs/ios-products)
- [Android Subscription Setup Guide](https://docs.revenuecat.com/docs/android-products)
- [Webhooks Documentation](https://docs.revenuecat.com/docs/webhooks)
- [Testing Guide](https://docs.revenuecat.com/docs/sandbox)

## Support

**RevenueCat Support**: support@revenuecat.com
**Community**: [RevenueCat Community Slack](https://www.revenuecat.com/community)
