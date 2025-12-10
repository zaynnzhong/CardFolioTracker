# Xcode Beginner's Guide - Complete Walkthrough

This guide will walk you through using Xcode for the first time to run your Prism Portfolio iOS app.

## Prerequisites

### 1. Install Xcode (If Not Already Installed)

**Step 1**: Open App Store on your Mac
- Click the Apple icon () in top-left corner
- Click "App Store"

**Step 2**: Search for Xcode
- Type "Xcode" in the search bar
- Click "Get" or "Download" (it's free, but ~15GB)
- Wait for installation (can take 30-60 minutes)

**Step 3**: Open Xcode for the first time
- Open "Applications" folder
- Double-click "Xcode"
- Click "Install" if prompted to install additional components
- Wait for component installation to complete

**Step 4**: Accept license
- Xcode will show a license agreement
- Click "Agree"

**Step 5**: Install Command Line Tools
```bash
xcode-select --install
```
- Click "Install" in the popup
- Wait for installation

### 2. Set Up Apple ID in Xcode (For Testing on Simulator)

**Step 1**: Open Xcode Preferences
- Open Xcode
- Click "Xcode" in menu bar → "Settings..." (or "Preferences" on older Xcode)
- Or press: `Cmd + ,`

**Step 2**: Go to Accounts
- Click "Accounts" tab at the top

**Step 3**: Add your Apple ID
- Click the "+" button in bottom-left
- Select "Apple ID"
- Enter your Apple ID email and password
- Click "Next"

**Note**: This is just your regular Apple ID (iCloud email). You don't need the paid Developer account yet for testing in simulator!

## Running Your App - Complete Step-by-Step

### Step 1: Build Your Web App

Open Terminal and navigate to your project:

```bash
cd /Users/jackyz/Documents/claude-card/CardFolioTracker
```

Run the build command:

```bash
npm run ios:run
```

**What this does**:
1. Builds your React app (creates `dist/` folder)
2. Syncs files to iOS project
3. Opens Xcode automatically

**Wait for**:
- "✓ built in X.XXs" message
- Xcode to open

### Step 2: Understanding the Xcode Window

When Xcode opens, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  Xcode Menu Bar                                             │
├──────────┬──────────────────────────────────────┬───────────┤
│          │                                      │           │
│  Left    │     Center Area                      │  Right    │
│  Sidebar │     (Code Editor / Interface Builder)│  Sidebar  │
│          │                                      │           │
│  Files & │                                      │  Settings │
│  Folders │                                      │  & Info   │
│          │                                      │           │
├──────────┴──────────────────────────────────────┴───────────┤
│  Bottom Panel (Console / Logs)                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Areas**:
- **Top Toolbar**: Device selector, Play/Stop buttons, Status
- **Left Sidebar**: Project files and folders
- **Center**: Where you edit code (we won't edit here)
- **Right Sidebar**: File properties (can hide this)
- **Bottom Panel**: Logs and debug info

### Step 3: Select a Simulator

**Look at the top toolbar** - you'll see something like:

```
Prism Portfolio > iPhone 15 Pro
     ↑                  ↑
  Your app          Selected device
```

**To change the simulator**:

1. **Click on the device name** (e.g., "iPhone 15 Pro")
2. A dropdown menu appears showing:
   ```
   iOS Simulators
   ├── iPhone 15 Pro Max
   ├── iPhone 15 Pro
   ├── iPhone 15
   ├── iPhone 14 Pro
   ├── iPhone SE (3rd generation)
   └── iPad Pro (12.9-inch)
   ```

3. **Choose any iPhone** (I recommend iPhone 14 Pro or iPhone 15 Pro)

**Don't see any devices?**
- Click "Add Additional Simulators..."
- Click "+" button
- Choose "Simulator"
- Select an iPhone model
- Click "Create"

### Step 4: Run Your App!

**Click the PLAY button** (▶) in the top-left toolbar

Or press: **`Cmd + R`**

**What happens next**:

1. **"Building..."** appears in top bar
   - Xcode is compiling your app
   - Wait 10-30 seconds (first build takes longer)

2. **Simulator window opens**
   - A new window showing an iPhone screen
   - It might take 30-60 seconds first time

3. **Your app launches!**
   - You'll see your Prism Portfolio app
   - Black background with lime green accents
   - Exactly like the web version!

### Step 5: Using the iOS Simulator

The Simulator is like a virtual iPhone on your Mac.

**Useful Simulator Controls**:

| Action | Shortcut |
|--------|----------|
| **Home button** | Cmd + Shift + H |
| **Lock screen** | Cmd + L |
| **Rotate device** | Cmd + Left/Right Arrow |
| **Screenshot** | Cmd + S |
| **Shake device** | Ctrl + Cmd + Z |

**Interacting with the app**:
- **Click** = Tap
- **Click and drag** = Swipe
- **Scroll** = Click and drag or use trackpad

### Step 6: Viewing Console Logs

To see what's happening in your app:

1. **Show the debug console** (if not visible):
   - Click "View" in menu bar
   - Click "Debug Area" → "Activate Console"
   - Or press: `Cmd + Shift + Y`

2. **Console appears at bottom** showing:
   ```
   [log] App started
   [log] User signed in
   [error] Network error (if any)
   ```

This is helpful for debugging!

### Step 7: Stopping Your App

**Click the STOP button** (■) in the top-left toolbar

Or press: **`Cmd + .`** (Cmd + period)

The simulator will return to the home screen.

## Common First-Time Issues

### Issue 1: "No Provisioning Profile Found"

**Error message**: "Signing for 'App' requires a development team..."

**Solution**:
1. Click on "App" in the left sidebar (the very top item)
2. Make sure "App" is selected under "TARGETS"
3. Click "Signing & Capabilities" tab
4. Under "Team", select your Apple ID
5. Xcode will automatically create a free provisioning profile

### Issue 2: Simulator is Slow

**Solution**:
- Simulators are RAM-intensive
- Close other apps while using simulator
- Choose older iPhone models (iPhone SE is faster)
- Restart your Mac if very slow

### Issue 3: White Screen in App

**Solution**:
1. Make sure you ran `npm run build` first
2. Check that `dist/` folder exists
3. Re-run: `npm run ios:build`

### Issue 4: Xcode Says "Build Failed"

**Check the error message** in the bottom panel (red text)

**Common fixes**:
```bash
# Clean and rebuild
npm run build
npx cap sync ios
```

Then try running again in Xcode.

### Issue 5: Can't Find Xcode Project

**Solution**:
```bash
# Open Xcode project directly
npm run ios:open
```

Or manually:
1. Open Finder
2. Navigate to: `/Users/jackyz/Documents/claude-card/CardFolioTracker/ios/App/`
3. Double-click `App.xcodeproj`

## Testing Your App Features

Once your app is running in the simulator:

### Test Sign In
1. Enter your email
2. Click "Send Code"
3. Check your email for OTP code
4. Enter the 6-digit code
5. Should sign you in!

### Test Adding a Card
1. Click "+" button
2. Fill in card details
3. Upload an image (use sample image from Mac)
4. Save card

### Test Offline Mode
1. **Disconnect from internet** (turn off WiFi)
2. **Relaunch app** in simulator
3. Your data should still be there!
4. Service worker should cache the app

## Running on a Real iPhone (Optional)

Want to test on your actual iPhone?

### Step 1: Connect iPhone to Mac
- Use a USB cable
- Unlock your iPhone
- Trust the computer (popup on iPhone)

### Step 2: Select Your iPhone in Xcode
- Your iPhone will appear in the device dropdown
- Example: "Jacky's iPhone"
- Click to select it

### Step 3: Trust Developer Certificate (First Time Only)
1. Click Play (▶) in Xcode
2. App installs on your iPhone
3. Go to iPhone Settings
4. Go to: **General → VPN & Device Management**
5. Click on your Apple ID
6. Click "Trust"
7. Click "Trust" again to confirm

### Step 4: Launch App
- App icon appears on iPhone home screen
- Tap to open
- It works just like a real app!

**Note**: App will stop working after 7 days with free Apple ID. You need to re-run from Xcode every week, or pay $99/year for Apple Developer account.

## Understanding the Xcode Interface in Detail

### Top Toolbar Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│  ▶ ■   Prism Portfolio > iPhone 15 Pro    [Building... 42s] │
│  ↑  ↑         ↑                  ↑                ↑         │
│ Play Stop   App Name         Device         Build Status    │
└─────────────────────────────────────────────────────────────┘
```

### Left Sidebar - Project Navigator

Shows your project files:

```
▼ App
  ▼ App
    ► AppDelegate.swift       (iOS app setup)
    ► Assets.xcassets        (Icons, images)
    ► Info.plist            (App configuration)
    ► public               (Your web app files)
  ► CapApp-SPM
```

**You won't need to edit these files!** Capacitor manages them.

### Useful Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + R` | Run app |
| `Cmd + .` | Stop app |
| `Cmd + B` | Build (compile) app |
| `Cmd + K` | Clear console |
| `Cmd + Shift + Y` | Show/hide console |
| `Cmd + 0` | Show/hide left sidebar |
| `Cmd + Opt + 0` | Show/hide right sidebar |
| `Cmd + ,` | Open preferences |
| `Cmd + Q` | Quit Xcode |

## Workflow Summary

**Every time you make changes to your web app**:

1. **Edit your React code** (VSCode or any editor)
2. **Build and sync**:
   ```bash
   npm run ios:build
   ```
3. **Run in Xcode**: Click Play (▶) or `Cmd + R`

**Quick workflow**:
```bash
# One command to do everything
npm run ios:run
```
Then click Play (▶) in Xcode.

## Visual Guide - What You'll See

### 1. Initial Xcode Window
When Xcode first opens, you might see:
- "Welcome to Xcode" window → Close it
- Your project appears in the main window

### 2. Select Device Screen
Top of Xcode shows:
```
┌──────────────────────────────┐
│ Prism Portfolio > [Device] ▼ │
└──────────────────────────────┘
           ↑
      Click here
```

### 3. Device Picker
Dropdown menu shows:
```
┌─────────────────────────────┐
│ iOS Simulators              │
├─────────────────────────────┤
│ ✓ iPhone 15 Pro            │
│   iPhone 15                 │
│   iPhone 14 Pro             │
│   iPhone SE                 │
│   iPad Pro 12.9"            │
└─────────────────────────────┘
```

### 4. Running State
Top bar shows:
```
Running Prism Portfolio on iPhone 15 Pro
```

### 5. Your App in Simulator
A new window opens showing an iPhone with your app running!

## Next Steps After Testing

Once you've tested your app in the simulator:

### For App Store Submission

1. **Test thoroughly** - Make sure everything works
2. **Take screenshots** - While running in simulator (Cmd + S)
3. **Get Apple Developer account** - $99/year
4. **Follow submission guide** - See [CAPACITOR_GUIDE.md](CAPACITOR_GUIDE.md)

### For Continued Development

```bash
# Keep these terminals running:

# Terminal 1 - Web dev server
npm run dev

# Terminal 2 - Backend server
npm run server
```

Then in Xcode:
- Edit capacitor.config.ts to use `http://localhost:3000`
- Run from Xcode
- Changes update in real-time!

## Getting Help

### Xcode Documentation
- In Xcode: **Help → Xcode Help**
- Or press: `Cmd + Shift + ?`

### Capacitor Documentation
- https://capacitorjs.com/docs/ios

### Common Problems
See [CAPACITOR_GUIDE.md](CAPACITOR_GUIDE.md) "Troubleshooting" section

## Summary - Quick Reference

**First time setup**:
1. Install Xcode from App Store
2. Add your Apple ID in Xcode Settings
3. Run `npm run ios:run`
4. Select a simulator
5. Click Play (▶)

**Every time after that**:
```bash
npm run ios:run
```
Then click Play (▶) in Xcode.

**That's it!** 🎉

---

**Need help?** Check the troubleshooting section or see [CAPACITOR_GUIDE.md](CAPACITOR_GUIDE.md) for more details.

**Ready to try?** Run this now:
```bash
cd /Users/jackyz/Documents/claude-card/CardFolioTracker
npm run ios:run
```

Your app will open in Xcode, then just click the Play button!
