# Capacitor iOS App Packaging Guide

This guide shows you how to package Prism Portfolio as a native iOS app using Capacitor.

## What is Capacitor?

Capacitor is a cross-platform app runtime from Ionic that makes it easy to build web apps that run natively on iOS, Android, and the web. It's better than PWABuilder because:

- ✅ Full native iOS project control
- ✅ Access to native iOS APIs and plugins
- ✅ Built-in splash screen and status bar management
- ✅ Live reload during development
- ✅ Easy to maintain and update
- ✅ Active community and plugin ecosystem

## ✅ Already Configured

Your project is ready to go with:

- [x] Capacitor installed and initialized
- [x] iOS platform added
- [x] App ID: `com.prismcards.portfolio`
- [x] App Name: `Prism Portfolio`
- [x] Configuration optimized for production
- [x] Helpful npm scripts added

## Quick Start

### 1. Build and Open iOS Project

```bash
# Build web app and sync to iOS
npm run ios:build

# Open Xcode
npm run ios:open
```

Or do it all at once:
```bash
npm run ios:run
```

### 2. Configure in Xcode

When Xcode opens:

1. **Select your Team**
   - Click on the project in the left sidebar
   - Select "Signing & Capabilities"
   - Choose your Apple Developer account under "Team"

2. **Update Bundle Identifier** (if needed)
   - It's already set to `com.prismcards.portfolio`
   - Change it if you want a different ID

3. **Add App Icon**
   - Click on "Assets" in the left sidebar
   - Drag your 1024x1024 icon to "AppIcon"

4. **Configure Display Name**
   - Already set to "Prism Portfolio"
   - Change in Info.plist if needed

### 3. Test on Simulator

1. In Xcode, select a simulator (e.g., iPhone 14 Pro)
2. Click the "Play" button or press Cmd+R
3. Your app will launch in the iOS Simulator!

### 4. Test on Real Device

1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click "Play" to build and run
4. First time: Go to Settings > General > VPN & Device Management
5. Trust your developer certificate
6. Launch the app!

## Project Structure

```
CardFolioTracker/
├── ios/                          # iOS native project (Xcode)
│   └── App/
│       ├── App.xcodeproj        # Xcode project
│       ├── App/                 # iOS app source
│       │   ├── Assets.xcassets  # App icons, splash screens
│       │   ├── public/          # Your built web app
│       │   └── Info.plist       # iOS app configuration
│       └── Podfile              # iOS dependencies
├── capacitor.config.ts          # Capacitor configuration
├── dist/                        # Built web app (auto-generated)
└── package.json                 # npm scripts
```

## Configuration Files

### capacitor.config.ts

Your Capacitor configuration at [capacitor.config.ts](capacitor.config.ts):

```typescript
{
  appId: 'com.prismcards.portfolio',
  appName: 'Prism Portfolio',
  webDir: 'dist',
  server: {
    url: 'https://prism-cards.com',  // Your production URL
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    scheme: 'capacitor'
  }
}
```

**Important**: The app loads your live website (`https://prism-cards.com`). This means:
- ✅ Updates are instant (no App Store review needed)
- ✅ Users always get the latest version
- ✅ You maintain a single codebase
- ⚠️ Requires internet connection (add offline caching with service workers)

## Development Workflow

### Making Changes

1. **Edit your web app** (React components, etc.)
2. **Build the web app**:
   ```bash
   npm run build
   ```
3. **Sync changes to iOS**:
   ```bash
   npx cap sync ios
   ```
4. **Run in Xcode** to test changes

### Quick Development Commands

```bash
# Full rebuild and open Xcode
npm run ios:run

# Just sync changes (faster)
npm run capacitor:sync

# Just copy web assets
npm run capacitor:copy

# Open Xcode
npm run ios:open
```

## Submitting to App Store

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Enroll at: https://developer.apple.com/programs/
   - Wait for approval (24-48 hours)

2. **App Store Connect**
   - Create your app at: https://appstoreconnect.apple.com/

### Step-by-Step Submission

#### 1. Prepare Assets

**App Icon** (Required):
- Size: 1024x1024 px
- No transparency
- No rounded corners (Apple adds them)
- Format: PNG
- Location: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

You can use your existing [public/prism-icon-512.png](public/prism-icon-512.png) but upscale to 1024x1024.

**Screenshots** (Required):
- iPhone 6.7": 1290 × 2796 px (iPhone 14 Pro Max)
- iPhone 6.5": 1284 × 2778 px (iPhone 13 Pro Max)
- iPhone 5.5": 1242 × 2208 px (iPhone 8 Plus)
- iPad Pro 12.9": 2048 × 2732 px

Take screenshots by:
1. Running app in Simulator
2. Cmd+S to save screenshot
3. Or use iPhone Screenshot tool

#### 2. Configure App in Xcode

**Update Info.plist**:
- Privacy descriptions (if using camera/location)
- Supported orientations
- Status bar style

**Update Version & Build**:
- Version: 1.0.0
- Build: 1
- Increment build number for each upload

#### 3. Create Archive

1. In Xcode: **Product > Archive**
2. Wait for build to complete
3. Window will open showing your archive

#### 4. Upload to App Store Connect

1. Click **Distribute App**
2. Select **App Store Connect**
3. Select **Upload**
4. Click **Next** through dialogs
5. Click **Upload**
6. Wait for upload to complete

#### 5. Fill Out App Store Listing

Go to [App Store Connect](https://appstoreconnect.apple.com/):

**App Information**:
- Name: `Prism Portfolio`
- Subtitle: `Sports Card Portfolio Tracker`
- Category: Finance (primary), Sports (secondary)
- Content Rights: No

**Pricing**:
- Price: Free
- Availability: All countries

**App Privacy**:
- Privacy Policy URL: `https://prism-cards.com/privacy-policy.html`
- User Privacy Choices URL: (optional)

**Version Information**:
- Screenshots: Upload your prepared screenshots
- Description:
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

Perfect for sports card collectors, trading card investors, and hobby enthusiasts.

Download now and see your real profits.
```

- Keywords (100 chars): `sports cards,portfolio,trading cards,investment,FIFO,profit,loss,tracker`
- Support URL: `https://prism-cards.com`
- Marketing URL: `https://prism-cards.com`

**App Review Information**:
- Demo Account: Provide test email/OTP for Apple reviewers
- Notes: "This app uses OTP email authentication. Test account provided above."

#### 6. Submit for Review

1. Click **Add for Review**
2. Select your build
3. Click **Submit to App Review**
4. Wait for Apple's review (typically 24-48 hours)

### Common Rejection Reasons

1. **Misleading screenshots** - Ensure they match actual app
2. **Broken links** - Test privacy policy and support URLs
3. **Missing test account** - Provide working login credentials
4. **Guideline violations** - Read [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Advanced Configuration

### Adding Native Plugins

Capacitor has plugins for native features:

```bash
# Install plugins
npm install @capacitor/camera
npm install @capacitor/push-notifications

# Sync to iOS
npx cap sync ios
```

Available plugins:
- Camera
- Push Notifications
- Geolocation
- Haptics
- Local Notifications
- Share
- And many more at: https://capacitorjs.com/docs/plugins

### Live Reload (Development)

For faster development, use live reload:

1. **Update capacitor.config.ts**:
```typescript
server: {
  url: 'http://YOUR_LOCAL_IP:3000',  // Your dev server
  cleartext: true
}
```

2. **Start dev server**: `npm run dev`
3. **Sync to iOS**: `npx cap sync ios`
4. **Run in Xcode**

Your app will now load from your local dev server!

**Remember**: Before production, change back to `https://prism-cards.com`

### Custom Splash Screen

1. Create 2732x2732 splash image
2. Add to `ios/App/App/Assets.xcassets/Splash.imageset/`
3. Configure in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: '#000000',
    showSpinner: false
  }
}
```

## Troubleshooting

### Build Fails in Xcode

**Error**: "Signing for ... requires a development team"
**Solution**: Select your team in Signing & Capabilities

**Error**: "Could not find developer disk image"
**Solution**: Update Xcode to latest version

### App Shows White Screen

**Check**:
1. Did you run `npm run build` first?
2. Is `webDir: 'dist'` correct in capacitor.config.ts?
3. Does `dist/index.html` exist?
4. Check Xcode console for errors

**Solution**: Run `npm run ios:build` to rebuild everything

### Changes Not Showing

**Solution**: Always sync after building:
```bash
npm run build
npx cap sync ios
```

### Network Errors

**Check**:
1. Is your production URL correct in capacitor.config.ts?
2. Is https://prism-cards.com accessible?
3. Check iOS console for CORS errors

## npm Scripts Reference

```bash
# Build web app and sync to iOS
npm run ios:build

# Open Xcode project
npm run ios:open

# Build and open (all-in-one)
npm run ios:run

# Sync changes to all platforms
npm run capacitor:sync

# Copy web assets only (faster than sync)
npm run capacitor:copy
```

## Testing Checklist

Before submitting to App Store:

### Functionality
- [ ] App launches without errors
- [ ] Sign in with OTP works
- [ ] All features work (add card, delete, edit, etc.)
- [ ] Images load correctly
- [ ] Charts render properly
- [ ] Offline mode works (if enabled)

### iOS-Specific
- [ ] App icon displays correctly
- [ ] Splash screen shows on launch
- [ ] Status bar styling correct
- [ ] No navigation bar from Safari
- [ ] Orientation locked to portrait
- [ ] No web browser UI elements

### Performance
- [ ] Loads in < 3 seconds
- [ ] Smooth scrolling
- [ ] No crashes
- [ ] Low memory usage

### Legal
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Contact email works

## Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **iOS Plugin Guide**: https://capacitorjs.com/docs/ios
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Capacitor Community**: https://ionic.io/community

## Cost Summary

- **Apple Developer Account**: $99/year
- **Capacitor**: Free (open source)
- **Hosting**: $0 (Vercel free tier)
- **Updates**: $0 (update via web, no resubmission)
- **Total First Year**: $99

## Next Steps

1. ✅ Capacitor is configured
2. ✅ iOS project is ready
3. 📱 Test in simulator: `npm run ios:run`
4. 🎨 Add your app icon
5. 📸 Take screenshots
6. 📝 Enroll in Apple Developer Program
7. 🚀 Submit to App Store

**Ready to test?** Run:
```bash
npm run ios:run
```

This will build your app and open it in Xcode!
