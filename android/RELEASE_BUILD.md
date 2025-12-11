# Android Release Build Instructions

This guide explains how to build and sign the Android app for Google Play Store release.

## Prerequisites

1. **Java Development Kit (JDK)** - Version 11 or higher
2. **Android Studio** (recommended) or Android SDK command-line tools
3. **Gradle** (included with Android Studio)

## Step 1: Create Release Signing Key

Generate a keystore file for signing your app:

```bash
keytool -genkey -v -keystore prism-release-key.keystore \
  -alias prism-portfolio \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Important:**
- Save the keystore file in a secure location (NOT in the project directory)
- Remember the keystore password and key password
- Keep a backup of the keystore file - if you lose it, you cannot update your app

## Step 2: Get SHA-256 Certificate Fingerprint

You need this for:
- Google Sign-In configuration
- Android App Links (assetlinks.json)
- Firebase configuration

```bash
keytool -list -v -keystore prism-release-key.keystore -alias prism-portfolio
```

Look for the **SHA-256** fingerprint in the output and update:
1. `public/.well-known/assetlinks.json` - Replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`
2. Google Cloud Console - Add to your Android OAuth 2.0 Client ID
3. Firebase Console - Add to your Android app

## Step 3: Configure Build Signing

Create `android/keystore.properties` file (this file is gitignored):

```properties
storeFile=/path/to/prism-release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=prism-portfolio
keyPassword=YOUR_KEY_PASSWORD
```

Then update `android/app/build.gradle` to use the signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 4: Create Android OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your Firebase project
3. Click **Create Credentials** > **OAuth client ID**
4. Choose **Android** as application type
5. Enter:
   - **Name**: Prism Portfolio Android
   - **Package name**: `com.prismcards.portfolio`
   - **SHA-1 certificate fingerprint**: (from Step 2)
6. Copy the Client ID and update `capacitor.config.ts`:
   ```typescript
   androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com'
   ```

## Step 5: Build the App Bundle

### For Google Play Store (AAB format - recommended):

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### For APK (alternative):

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Step 6: Prepare for Google Play Console

1. **App Bundle**: Use the `.aab` file from Step 5
2. **Version Code**: Update in `android/app/build.gradle` (increment for each release)
3. **Version Name**: Update in `android/app/build.gradle` (e.g., "1.0", "1.1", etc.)

## Step 7: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Navigate to **Production** > **Create new release**
4. Upload the `.aab` file
5. Fill in release details:
   - Release name (e.g., "1.0")
   - Release notes
6. Review and submit for review

## Step 8: Configure App Listing

### Required Information:

- **App name**: Prism Portfolio
- **Short description**: Sports card portfolio tracker with FIFO, trades & P/L
- **Full description**: See marketing copy in project README
- **App category**: Business or Finance
- **Screenshots**: Minimum 2 phone screenshots
- **Feature graphic**: 1024 x 500 px
- **App icon**: 512 x 512 px (already in project)

### Content Rating:

Complete the content rating questionnaire (ESRB, PEGI, etc.)

### Privacy Policy:

Provide URL to your privacy policy

### Target Audience:

Select appropriate age ranges

## Troubleshooting

### Build Fails with "Keystore not found"

Make sure `keystore.properties` exists and has the correct path to your keystore file.

### Google Sign-In Doesn't Work

1. Verify SHA-256 fingerprint is added to Google Cloud Console
2. Check that `androidClientId` matches the one from Google Cloud Console
3. Ensure `assetlinks.json` is accessible at `https://prism-cards.com/.well-known/assetlinks.json`

### App Links Not Working

1. Test with [App Links Assistant](https://developer.android.com/studio/write/app-link-indexing) in Android Studio
2. Verify `assetlinks.json` is properly formatted and accessible
3. Check that `android:autoVerify="true"` is set in AndroidManifest.xml

## Version Management

Update these files for each release:

1. `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1 for each release
   versionName "1.1"  // Semantic versioning
   ```

2. Create git tag:
   ```bash
   git tag -a android-v1.0 -m "Android Release 1.0"
   git push origin android-v1.0
   ```

## Additional Resources

- [Android App Bundles](https://developer.android.com/guide/app-bundle)
- [Sign your app](https://developer.android.com/studio/publish/app-signing)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Links](https://developer.android.com/training/app-links)
