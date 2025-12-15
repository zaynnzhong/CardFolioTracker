# RevenueCat Integration Checklist

Use this checklist to ensure your RevenueCat integration is properly configured for PRISM Cards Portfolio.

## ✅ Code Implementation

### Environment Configuration
- [x] API keys added to `.env.local`
  - `VITE_REVENUECAT_API_KEY_IOS=test_yyyEOwwPxQpfisLpMNsNPeaxkCE`
  - `VITE_REVENUECAT_API_KEY_ANDROID=test_yyyEOwwPxQpfisLpMNsNPeaxkCE`
- [x] Product identifiers configured in `services/revenueCatService.ts`:
  - `monthly`
  - `yearly`
  - `lifetime`
- [x] Entitlement identifier set to `PRISM Cards Portfolio Pro`

### SDK Integration
- [x] RevenueCat Capacitor SDK installed (`@revenuecat/purchases-capacitor`)
- [x] RevenueCat service layer created (`services/revenueCatService.ts`)
- [x] SDK initialized with Firebase UID as `appUserID`
- [x] User attributes synced (email, displayName)

### Features Implemented
- [x] Paywall modal component (`components/PaywallModal.tsx`)
- [x] Card limit banner (`components/CardLimitBanner.tsx`)
- [x] Purchase flow with error handling
- [x] Restore purchases functionality
- [x] Customer Center integration (manage subscriptions)
- [x] Platform detection (web vs native)
- [x] Fallback to unlock keys on web platform

### Error Handling
- [x] Network error handling
- [x] Payment error handling
- [x] User cancellation handling (silent)
- [x] Descriptive error messages for users
- [x] Proper try-catch blocks throughout

## 📋 RevenueCat Dashboard Configuration

### Step 1: Create RevenueCat Account
- [ ] Sign up at [RevenueCat Dashboard](https://app.revenuecat.com)
- [ ] Create project: "PRISM Cards Portfolio" or similar
- [ ] Note your project ID

### Step 2: Configure iOS App
- [ ] Go to **Projects** → **Apps** → **+ New** → **iOS**
- [ ] Enter Bundle ID: `com.prismcards.portfolio`
- [ ] Copy iOS API Key and verify it matches `.env.local`
- [ ] Configure Shared Secret from App Store Connect

### Step 3: Configure Android App
- [ ] Go to **Projects** → **Apps** → **+ New** → **Android**
- [ ] Enter Package Name: `com.prismcards.portfolio`
- [ ] Copy Android API Key and verify it matches `.env.local`
- [ ] Upload Play Store service account JSON

### Step 4: Create Products in App Stores

**iOS - App Store Connect:**
- [ ] Create product: `monthly` (Auto-renewable subscription)
- [ ] Create product: `yearly` (Auto-renewable subscription)
- [ ] Create product: `lifetime` (Non-consumable in-app purchase)
- [ ] Create subscription group: "Pro Access" or "PRISM Pro"
- [ ] Add monthly and yearly to subscription group
- [ ] Set pricing for each product
- [ ] Get Shared Secret and add to RevenueCat
- [ ] Submit products for review

**Android - Google Play Console:**
- [ ] Create product: `monthly` (Subscription)
- [ ] Create product: `yearly` (Subscription)
- [ ] Create product: `lifetime` (In-app product)
- [ ] Set pricing for each product
- [ ] Download service account JSON
- [ ] Upload to RevenueCat under **Service Credentials**

### Step 5: Create Entitlements
- [ ] Go to **Entitlements** in RevenueCat Dashboard
- [ ] Click **+ New Entitlement**
- [ ] Identifier: `PRISM Cards Portfolio Pro` (exact match required)
- [ ] Description: "Unlimited cards and premium features"

### Step 6: Create Offerings
- [ ] Go to **Offerings** in RevenueCat Dashboard
- [ ] Create **Current** offering (or name it "Default")
- [ ] Add three packages:

  **Monthly Package:**
  - [ ] Package identifier: `monthly` or `$rc_monthly`
  - [ ] Links to product: `monthly`
  - [ ] Grants entitlement: `PRISM Cards Portfolio Pro`

  **Yearly Package:**
  - [ ] Package identifier: `yearly` or `$rc_annual`
  - [ ] Links to product: `yearly`
  - [ ] Grants entitlement: `PRISM Cards Portfolio Pro`

  **Lifetime Package:**
  - [ ] Package identifier: `lifetime` or `$rc_lifetime`
  - [ ] Links to product: `lifetime`
  - [ ] Grants entitlement: `PRISM Cards Portfolio Pro`

- [ ] Save offering and make it the **Current** offering

## 🧪 Testing

### iOS Testing
- [ ] Create sandbox tester in App Store Connect
- [ ] Sign out of Apple ID on test device
- [ ] Run app on device/simulator
- [ ] Test monthly subscription purchase
- [ ] Test yearly subscription purchase
- [ ] Test lifetime purchase
- [ ] Verify entitlement grants unlimited access
- [ ] Delete app and test restore purchases
- [ ] Test Customer Center (manage subscription)

### Android Testing
- [ ] Add test account in Google Play Console
- [ ] Set up internal testing track
- [ ] Add your email as internal tester
- [ ] Download app from test link
- [ ] Test monthly subscription purchase
- [ ] Test yearly subscription purchase
- [ ] Test lifetime purchase
- [ ] Verify entitlement grants unlimited access
- [ ] Reinstall app and test restore purchases
- [ ] Test Customer Center (manage subscription)

### Web Testing
- [ ] Verify paywall shows "In-app purchases only on mobile"
- [ ] Verify fallback to unlock key input works
- [ ] Test unlock key redemption

## 🔍 Verification Steps

### Check SDK Initialization
- [ ] Open browser console or device logs
- [ ] Look for `[RevenueCat] Initialized successfully for user:` message
- [ ] Verify no initialization errors

### Check Offerings Loading
- [ ] Open paywall modal
- [ ] Verify three subscription options appear
- [ ] Verify prices are displayed correctly
- [ ] Check console for `[RevenueCat] Offerings:` log

### Check Entitlement After Purchase
- [ ] Make test purchase
- [ ] Check console for `[RevenueCat] Purchase successful:` message
- [ ] Verify app reloads and card limit banner disappears
- [ ] Verify user can add unlimited cards
- [ ] Check console for `[App] User has Pro access via RevenueCat`

### Check Customer Info
- [ ] In RevenueCat Dashboard → **Customers**
- [ ] Search for your test user (by Firebase UID)
- [ ] Verify active entitlements show `PRISM Cards Portfolio Pro`
- [ ] Verify subscription status is active
- [ ] Check purchase history

## 🚀 Production Deployment

### Before Going Live
- [ ] All products approved in App Store Connect
- [ ] All products approved in Google Play Console
- [ ] Offerings configured and set as **Current**
- [ ] Entitlement identifier matches exactly: `PRISM Cards Portfolio Pro`
- [ ] Test purchases completed successfully
- [ ] Restore purchases tested and working
- [ ] Customer Center tested and working

### Optional: Webhook Configuration
- [ ] Set up webhook endpoint: `/api/webhooks/revenuecat`
- [ ] Add webhook URL in RevenueCat Dashboard → **Integrations** → **Webhooks**
- [ ] Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
- [ ] Implement webhook handler in `server/src/routes.ts`
- [ ] Test webhook with RevenueCat's webhook tester

### Launch Checklist
- [ ] Remove debug log level (set to `INFO` or `WARN`)
- [ ] Update pricing strategy based on market research
- [ ] Set up analytics tracking (optional)
- [ ] Configure trial periods if desired
- [ ] Set up promotional offers (optional)
- [ ] Monitor RevenueCat Dashboard for issues

## 📊 Post-Launch Monitoring

### Daily Checks (First Week)
- [ ] Check RevenueCat Dashboard for active subscriptions
- [ ] Monitor error logs for SDK issues
- [ ] Check purchase success rate
- [ ] Verify entitlements are being granted correctly

### Weekly Checks
- [ ] Review MRR (Monthly Recurring Revenue) in Dashboard
- [ ] Check churn rate
- [ ] Review customer feedback on pricing
- [ ] Analyze conversion rates for each package

### Monthly Checks
- [ ] Review subscription trends
- [ ] Test new OS versions for compatibility
- [ ] Update SDK if new version available
- [ ] Review and optimize pricing if needed

## 🆘 Troubleshooting

### "No offerings available" Error
- [ ] Verify offerings are created in Dashboard
- [ ] Check offering is set as **Current**
- [ ] Verify product IDs match exactly
- [ ] Check products are approved in App Store/Play Store

### "Purchase failed" Error
- [ ] Check product IDs match in all locations
- [ ] Verify Shared Secret (iOS) is configured
- [ ] Verify service credentials (Android) are uploaded
- [ ] Check device payment method is valid

### "No active subscriptions found" (Restore)
- [ ] Verify same `appUserID` is used (Firebase UID)
- [ ] Check purchase was made on same platform
- [ ] Verify entitlement identifier matches exactly
- [ ] Check subscription status in RevenueCat Dashboard

### Entitlement Not Granted
- [ ] Verify entitlement ID is exactly: `PRISM Cards Portfolio Pro`
- [ ] Check offerings link products to correct entitlement
- [ ] Verify purchase completed successfully
- [ ] Check customer info in RevenueCat Dashboard

## ✨ Additional Features to Consider

### Future Enhancements
- [ ] Add introductory pricing (e.g., $0.99 first month)
- [ ] Configure free trial period (e.g., 7 days)
- [ ] Set up promotional offers for lapsed subscribers
- [ ] Implement A/B testing for pricing
- [ ] Add seasonal discounts
- [ ] Create family sharing plan (iOS only)
- [ ] Add student discount tier

### Analytics Integration
- [ ] Connect Google Analytics (optional)
- [ ] Connect Mixpanel (optional)
- [ ] Set up custom events for purchase funnel
- [ ] Track conversion rates by source

## 📚 Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Capacitor SDK Guide](https://docs.revenuecat.com/docs/capacitor)
- [Testing Guide](https://docs.revenuecat.com/docs/sandbox)
- [Webhooks Documentation](https://docs.revenuecat.com/docs/webhooks)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

**Note**: This checklist is comprehensive but flexible. Not all items are required for initial launch. Prioritize core functionality first, then add enhancements over time.
