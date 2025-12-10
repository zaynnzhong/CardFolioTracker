# Prism Portfolio - iOS App Store Preparation

This branch contains all the necessary configurations and assets for submitting Prism Portfolio as a PWA to the iOS App Store.

## What's Been Configured

### ✅ PWA Features
- [x] Service Worker with offline support
- [x] Web App Manifest with iOS optimizations
- [x] Push notification support (future ready)
- [x] Installable on iOS Home Screen
- [x] Splash screens for all iOS devices
- [x] App icons in all required sizes

### ✅ iOS-Specific Optimizations
- [x] Apple Touch Icons
- [x] iOS meta tags for PWA
- [x] Splash screens for iPhone 8 - iPhone 14 Pro Max
- [x] Splash screens for iPad models
- [x] Status bar styling
- [x] Viewport optimization

### ✅ Legal & Compliance
- [x] Privacy Policy ([/privacy-policy.html](public/privacy-policy.html))
- [x] Terms of Service ([/terms-of-service.html](public/terms-of-service.html))
- [x] GDPR compliance statements
- [x] CCPA compliance statements

### ✅ App Store Requirements
- [x] Structured data (Schema.org)
- [x] SEO meta tags
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Detailed app manifest

## Files Added/Modified

### New Files
```
/IOS_APP_STORE_GUIDE.md          - Complete submission guide
/README_IOS.md                   - This file
/scripts/generate-splash-screens.js - Helper for splash screens
/public/privacy-policy.html      - Privacy policy page
/public/terms-of-service.html    - Terms of service page
```

### Modified Files
```
/index.html                      - Added iOS meta tags & splash screens
/vite.config.ts                  - Enhanced PWA manifest
```

## Next Steps

### 1. Generate Splash Screens

You need to create splash screen images. Options:

**Option A: PWA Builder (Easiest)**
1. Visit https://www.pwabuilder.com/
2. Enter: `https://prism-cards.com`
3. Download iOS package with splash screens

**Option B: Manual Creation**
1. Run: `node scripts/generate-splash-screens.js` to see required sizes
2. Create images with:
   - Background: #000000 (black)
   - Logo: Centered, using your Prism logo
   - Color accent: #9aea62 (lime green)
3. Save to: `public/splash/`

Required splash screen sizes:
- iPhone 14 Pro Max: 1290x2796
- iPhone 14 Pro: 1179x2556
- iPhone 13 Pro Max: 1284x2778
- iPhone 13 Pro: 1170x2532
- iPhone 13 mini: 1125x2436
- iPhone 11 Pro Max: 1242x2688
- iPhone 11: 828x1792
- iPhone 8: 750x1334
- iPhone SE: 640x1136
- iPad Pro 12.9": 2048x2732
- iPad Pro 11": 1668x2388
- iPad Air: 1640x2360
- iPad 10.2": 1620x2160

### 2. Take App Store Screenshots

Use iPhone Simulator or real device:
1. Portfolio overview page
2. Card details with price chart
3. Watchlist view
4. Add card screen

Required screenshot sizes:
- iPhone 6.7": 1290x2796 (iPhone 14 Pro Max)
- iPhone 6.5": 1284x2778 (iPhone 13 Pro Max)
- iPhone 5.5": 1242x2208 (iPhone 8 Plus)
- iPad Pro 12.9": 2048x2732

Save to: `public/screenshots/`

### 3. Create 1024x1024 App Store Icon

Use your existing logo and upscale to 1024x1024:
- No transparency
- No rounded corners (Apple adds them)
- PNG format
- Save as: `public/app-store-icon.png`

### 4. Get Apple Developer Account

1. Visit https://developer.apple.com/programs/
2. Enroll ($99/year)
3. Wait for approval (usually 24 hours)

### 5. Generate iOS App Package

**Using PWABuilder (Recommended):**
1. Go to https://www.pwabuilder.com/
2. Enter URL: `https://prism-cards.com`
3. Click "Package For Stores"
4. Select "iOS"
5. Download Xcode project

**Manual Setup:**
1. Create Xcode project
2. Add WKWebView loading your URL
3. Configure capabilities
4. Add app icons

### 6. Test PWA on iOS

Before submission, test thoroughly:
```bash
# 1. Build the app
npm run build

# 2. Preview production build
npm run preview

# 3. Test on iPhone
- Open Safari on iPhone
- Visit: https://prism-cards.com
- Tap Share → Add to Home Screen
- Test all features offline
```

### 7. Submit to App Store

Follow the complete guide: [IOS_APP_STORE_GUIDE.md](IOS_APP_STORE_GUIDE.md)

Quick checklist:
- [ ] Splash screens generated
- [ ] Screenshots taken
- [ ] 1024x1024 icon created
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Apple Developer account active
- [ ] iOS package generated
- [ ] Test account credentials ready
- [ ] App metadata written
- [ ] Submitted for review

## Testing Checklist

Before submitting to App Store:

### Functionality
- [ ] Sign in with OTP works
- [ ] Add card functionality
- [ ] Delete card functionality
- [ ] Edit card details
- [ ] Price history updates
- [ ] Watchlist add/remove
- [ ] Market insights (Gemini AI)
- [ ] Image uploads work
- [ ] Offline mode works

### iOS-Specific
- [ ] "Add to Home Screen" works
- [ ] App launches without Safari UI
- [ ] Splash screen shows on launch
- [ ] App icon displays correctly
- [ ] Status bar styling correct
- [ ] Orientation locks to portrait
- [ ] No CORS errors
- [ ] Push notifications (if enabled)

### Performance
- [ ] Loads in <3 seconds
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Images load efficiently
- [ ] Service worker caches correctly

### Legal
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Contact email works
- [ ] Support page loads

## Deployment

This branch is ready for deployment. When you're ready:

```bash
# 1. Commit all changes
git add .
git commit -m "iOS App Store preparation complete"

# 2. Push to remote
git push origin ios-app-store-prep

# 3. Deploy to Vercel (or merge to main)
# Vercel will automatically deploy this branch
```

## URLs to Verify

Before App Store submission, verify these URLs work:
- ✅ https://prism-cards.com
- ✅ https://prism-cards.com/privacy-policy.html
- ✅ https://prism-cards.com/terms-of-service.html

## Support & Resources

- **Apple Developer**: https://developer.apple.com/
- **PWA Builder**: https://www.pwabuilder.com/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Submission Guide**: [IOS_APP_STORE_GUIDE.md](IOS_APP_STORE_GUIDE.md)
- **Contact**: noreply@prism-cards.com

## Cost Summary

- Apple Developer Account: $99/year (required)
- PWA Hosting: $0 (Vercel free tier)
- Updates: $0 (update via web, no resubmission needed)
- Total first year: $99

## Timeline Estimate

- Splash screens: 2-3 hours
- Screenshots: 1 hour
- Apple account setup: 1 day (waiting for approval)
- Xcode project setup: 2-3 hours
- App Store submission: 1 hour
- Apple review: 1-3 days
- **Total: ~1 week**

## Pro Tips

1. **Start the Apple Developer enrollment early** - it can take 24-48 hours
2. **Test thoroughly on real iOS devices** before submitting
3. **Prepare for rejection** - it's common on first submission
4. **Have test credentials ready** - Apple will want to test your app
5. **Respond quickly to Apple** - reviews can be expedited if you're responsive

## Questions?

Read the detailed guide: [IOS_APP_STORE_GUIDE.md](IOS_APP_STORE_GUIDE.md)

Or contact: noreply@prism-cards.com

---

**Ready to submit?** Follow the step-by-step guide in [IOS_APP_STORE_GUIDE.md](IOS_APP_STORE_GUIDE.md)
