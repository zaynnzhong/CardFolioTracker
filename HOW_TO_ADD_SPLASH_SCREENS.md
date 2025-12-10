# How to Add Splash Screens to Your iOS App

## Where to Upload Splash Screens

Your iOS splash screens go in the **Xcode project's Assets folder**.

### Location:
```
ios/App/App/Assets.xcassets/Splash.imageset/
```

## Two Ways to Add Splash Screens

### Method 1: Using Xcode (Easiest) ⭐

1. **Open your project in Xcode**:
   ```bash
   npm run ios:open
   ```

2. **In the left sidebar**, click on **"Assets"** (or "Assets.xcassets")
   ```
   ▼ App
     ▼ App
       ► AppDelegate.swift
       ► Assets.xcassets    ← Click here
       ► Info.plist
   ```

3. **You'll see "Splash" in the center panel**
   - Look for an item called "Splash" in the asset list
   - Click on it

4. **Drag and drop your splash screen images**:
   - You'll see three slots: 1x, 2x, 3x
   - **Recommended**: Just add one large image (2732x2732 px) to the **3x slot**
   - Xcode will scale it automatically

5. **Image requirements**:
   - **Size**: 2732x2732 pixels (iPad Pro 12.9" size - largest)
   - **Format**: PNG
   - **Design**:
     - Black background (#000000)
     - Centered Prism logo
     - Lime green accent (#9aea62)
     - Keep it simple!

### Method 2: Manual File Copy

1. **Create your splash screen image** (2732x2732 px PNG)

2. **Navigate to the folder**:
   ```bash
   cd /Users/jackyz/Documents/claude-card/CardFolioTracker/ios/App/App/Assets.xcassets/Splash.imageset/
   ```

3. **Replace the existing images**:
   ```bash
   # Remove old images
   rm splash-2732x2732*.png

   # Copy your new splash screen (rename to match expected name)
   cp /path/to/your/splash.png splash-2732x2732.png
   cp /path/to/your/splash.png splash-2732x2732-1.png
   cp /path/to/your/splash.png splash-2732x2732-2.png
   ```

4. **Sync to Xcode**:
   ```bash
   npx cap sync ios
   ```

## Creating Your Splash Screen

### Design Recommendations

**Simple approach** (recommended):
```
┌──────────────────────────────┐
│                              │
│                              │
│           [Logo]             │  ← Your Prism logo
│        Prism Portfolio       │  ← App name (optional)
│                              │
│                              │
└──────────────────────────────┘
   Black background (#000000)
   Lime logo/text (#9aea62)
```

### Tools to Create Splash Screen

#### Option 1: Figma (Free)
1. Go to https://www.figma.com/
2. Create new file
3. Create frame: 2732x2732 px
4. Add black rectangle as background
5. Add your logo (centered)
6. Export as PNG

#### Option 2: Canva (Free)
1. Go to https://www.canva.com/
2. Create custom size: 2732x2732 px
3. Black background
4. Add your logo
5. Download as PNG

#### Option 3: Use Your Existing Logo
You already have these icons:
- `/public/prism-icon-512.png`
- `/public/prism-fav.png`
- `/public/app-icon.png`

**Quick method**:
1. Open any of these in Preview (Mac)
2. Tools → Adjust Size → 2732x2732
3. Save as new file
4. Add black background if needed

#### Option 4: Online Tool - PWA Builder
1. Go to https://www.pwabuilder.com/
2. Enter: `https://prism-cards.com`
3. Click "Package For Stores" → "iOS"
4. Download the package - it includes splash screens!

## Current Splash Screen Configuration

Your app is already configured to show a splash screen in [capacitor.config.ts](capacitor.config.ts):

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,      // Show for 2 seconds
    backgroundColor: '#000000',    // Black background
    showSpinner: false,            // No loading spinner
    spinnerColor: '#9aea62'        // Lime green (if enabled)
  }
}
```

## Quick Setup - Use Existing Icon

If you just want to get started quickly:

1. **Copy your existing app icon as splash**:
   ```bash
   cd /Users/jackyz/Documents/claude-card/CardFolioTracker

   # Copy icon to splash location
   cp public/prism-icon-512.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png
   ```

2. **Open in Xcode**:
   ```bash
   npm run ios:open
   ```

3. **Click Assets → Splash** and verify the image is there

4. **Run the app** to see your splash screen:
   - Click Play (▶) in Xcode
   - You'll see the splash screen for 2 seconds when app launches!

## Testing Your Splash Screen

1. **Run in simulator**:
   ```bash
   npm run ios:run
   ```

2. **In Xcode**, click Play (▶)

3. **Watch for the splash**:
   - When app launches, you'll see your splash screen
   - It shows for 2 seconds
   - Then your login page appears

4. **To see it again**:
   - Press `Cmd + Shift + H` (go to home)
   - Click your app icon
   - Splash shows again!

## Customizing Splash Duration

Want to change how long the splash shows?

Edit [capacitor.config.ts](capacitor.config.ts):

```typescript
SplashScreen: {
  launchShowDuration: 3000,  // Change to 3 seconds (3000ms)
  backgroundColor: '#000000',
  showSpinner: false
}
```

Then rebuild:
```bash
npm run ios:build
```

## Recommended Splash Screen Design

For the best iOS App Store presentation:

### Size & Format
- **2732 x 2732 px** (square, covers all devices)
- **PNG format**
- **No transparency** (solid background)

### Design Elements
```
Background: #000000 (black)
Logo: Centered, ~800px size
Color: #9aea62 (lime green)
Text: Optional "Prism Portfolio" below logo
Font: Manrope Bold (your brand font)
```

### What NOT to include
- ❌ No loading text ("Loading...")
- ❌ No progress bars
- ❌ No busy content
- ❌ No text-heavy designs
- ✅ Keep it simple and clean

## Files You Need

**Minimum**:
- One splash image (2732x2732 px)

**Location to add it**:
- Via Xcode: `Assets > Splash`
- Or manually: `ios/App/App/Assets.xcassets/Splash.imageset/`

## Current Setup Status

✅ Splash screen **already configured** in capacitor.config.ts
✅ Splash screen **placeholder exists** in Assets.xcassets
⏳ Need to **replace placeholder** with your branded splash screen

## Next Steps

1. **Create your splash screen image** (2732x2732 px)
2. **Open Xcode**: `npm run ios:open`
3. **Click Assets → Splash**
4. **Drag your image** to the 3x slot
5. **Test**: Click Play (▶) in Xcode
6. **Done!** Your splash screen shows on app launch

---

**Need help creating a splash screen?**
- Use your existing logo at [public/prism-icon-512.png](public/prism-icon-512.png)
- Or use PWA Builder to auto-generate: https://www.pwabuilder.com/

**Questions?** See [CAPACITOR_GUIDE.md](CAPACITOR_GUIDE.md) for more details.
