# iOS App Store Submission Guide for Prism Portfolio PWA

This guide explains how to submit your PWA to the iOS App Store using PWABuilder.

## Prerequisites

- Active Apple Developer Account ($99/year)
- Your PWA deployed and accessible at https://prism-cards.com
- Valid SSL certificate (already done via Vercel)

## Option 1: PWABuilder (Recommended - Easiest)

### Step 1: Generate iOS App Package

1. Go to [PWABuilder.com](https://www.pwabuilder.com/)
2. Enter your URL: `https://prism-cards.com`
3. Click "Start"
4. Review your PWA score and manifest
5. Click "Package For Stores"
6. Select **iOS**
7. Download the generated Xcode project

### Step 2: Customize in Xcode

1. Open the downloaded `.xcodeproj` file in Xcode
2. Update Bundle Identifier: `com.prismcards.portfolio`
3. Update Display Name: `Prism Portfolio`
4. Set Team to your Apple Developer account
5. Add required capabilities:
   - Push Notifications (for future updates)
   - Background Modes

### Step 3: App Store Assets

You need to prepare:

#### App Icon (Required)
- 1024x1024px PNG (no transparency)
- Use your existing `/prism-icon-512.png` but upscale to 1024x1024

#### Screenshots (Required)
You need screenshots for:
- iPhone 6.7" (1290 × 2796) - iPhone 14 Pro Max
- iPhone 6.5" (1284 × 2778) - iPhone 13 Pro Max
- iPhone 5.5" (1242 × 2208) - iPhone 8 Plus
- iPad Pro 12.9" (2048 × 2732)

Create these by:
1. Opening https://prism-cards.com on iPhone Safari
2. Using iPhone Simulator in Xcode
3. Taking screenshots showing:
   - Portfolio overview
   - Card details
   - Price history chart
   - Watchlist

#### App Store Information

**Category**: Finance (Primary), Sports (Secondary)

**Keywords** (100 chars max):
```
sports cards,portfolio,trading cards,investment,FIFO,profit,loss,tracker
```

**Description** (4000 chars max):
```
Prism Portfolio - The Only Honest Sports Card Portfolio Tracker

Finally, an app that doesn't lie about your profits.

ACCURATE PROFIT TRACKING
• FIFO (First In, First Out) accounting for taxes
• Real profit/loss calculations
• Track cash invested vs current value
• No inflated numbers from AI scanners

COMPREHENSIVE FEATURES
• Add cards with current market prices
• Track price history over time
• Create watchlists for cards you're eyeing
• Beautiful charts and analytics
• Dark mode optimized interface

CARD-FOR-CARD TRADES
• Properly account for trades between cards
• Track trade history
• Maintain accurate basis calculations

PRIVACY FIRST
• Your data stays yours
• Secure authentication
• No ads, no selling your data

Perfect for:
- Sports card collectors
- Trading card investors
- Hobby enthusiasts
- Portfolio managers

Whether you collect basketball, baseball, football, Pokémon, or any trading cards, Prism Portfolio gives you the accurate financial tracking you need.

Download now and see your real profits.
```

**Support URL**: `https://prism-cards.com`

**Privacy Policy URL**: You need to create this (see below)

### Step 4: Privacy Policy (Required)

Create a simple privacy policy at `/privacy-policy.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Prism Portfolio - Privacy Policy</title>
</head>
<body>
    <h1>Privacy Policy for Prism Portfolio</h1>
    <p>Last updated: December 2025</p>

    <h2>Information We Collect</h2>
    <p>We collect:</p>
    <ul>
        <li>Email address for authentication</li>
        <li>Card portfolio data you manually enter</li>
        <li>Usage analytics (anonymous)</li>
    </ul>

    <h2>How We Use Your Data</h2>
    <ul>
        <li>To provide authentication and secure access</li>
        <li>To sync your portfolio across devices</li>
        <li>To improve our service</li>
    </ul>

    <h2>Data Storage</h2>
    <p>Your data is stored securely using:</p>
    <ul>
        <li>Firebase Authentication (Google)</li>
        <li>MongoDB Atlas (encrypted)</li>
        <li>ImageKit for image storage</li>
    </ul>

    <h2>Data Sharing</h2>
    <p>We do NOT:</p>
    <ul>
        <li>Sell your data</li>
        <li>Share your data with third parties</li>
        <li>Use your data for advertising</li>
    </ul>

    <h2>Your Rights</h2>
    <p>You can:</p>
    <ul>
        <li>Request data deletion</li>
        <li>Export your data</li>
        <li>Delete your account</li>
    </ul>

    <h2>Contact</h2>
    <p>Email: noreply@prism-cards.com</p>
</body>
</html>
```

### Step 5: Submit to App Store

1. In Xcode, select **Product > Archive**
2. Once archived, click **Distribute App**
3. Select **App Store Connect**
4. Upload to App Store
5. Go to [App Store Connect](https://appstoreconnect.apple.com)
6. Fill in all metadata (description, screenshots, etc.)
7. Submit for review

## Option 2: Native iOS App with WKWebView

If PWABuilder doesn't work, you can create a native wrapper:

1. Create new Xcode project (iOS App)
2. Add WKWebView loading `https://prism-cards.com`
3. Configure Info.plist for camera access (for future card scanning)
4. Add proper error handling
5. Configure offline support

## Required Files Checklist

- [x] PWA Manifest (`vite.config.ts`) ✅
- [x] Service Worker (via Vite PWA) ✅
- [x] App Icons (all sizes) ✅
- [ ] Splash Screens (generate using `/scripts/generate-splash-screens.js`)
- [ ] Screenshots for App Store
- [ ] Privacy Policy page
- [ ] Support/Contact page
- [ ] 1024x1024 App Store Icon

## App Store Review Tips

1. **Be Ready to Respond**: Apple typically reviews in 24-48 hours
2. **Common Rejections**:
   - Missing privacy policy
   - Broken links
   - App not functional
   - Misleading screenshots

3. **Have Test Account Ready**: Provide Apple with test login credentials

4. **Demonstrate Unique Value**: Explain how your app differs from a simple website

## Cost & Timeline

- Apple Developer Account: $99/year (required)
- Review time: 24-48 hours (first submission)
- Rejections are common - be patient and responsive

## Testing Before Submission

1. Test PWA on real iPhone via Safari
2. Test "Add to Home Screen" functionality
3. Test offline mode
4. Test all core features
5. Verify all links work
6. Check push notifications (if enabled)

## Post-Submission

Once approved:
- Monitor crash reports in App Store Connect
- Respond to user reviews
- Push updates via your website (PWA advantage!)
- Track analytics

## Support

- Apple Developer Documentation: https://developer.apple.com/app-store/
- PWABuilder Documentation: https://docs.pwabuilder.com/
- Contact: noreply@prism-cards.com
