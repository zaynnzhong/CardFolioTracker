import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prismcards.portfolio',
  appName: 'Prism Portfolio',
  webDir: 'dist',
  server: {
    // Load from production website for iOS app
    url: 'https://prism-cards.com',
    cleartext: true
  },
  ios: {
    contentInset: 'never',  // Let CSS handle safe areas via env()
    scrollEnabled: false,   // Disable native scrolling, let web handle it
    backgroundColor: '#000000',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    // Use WKWebView to load your PWA
    scheme: 'capacitor'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#9aea62'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '398836187935-rbujq4f4v9ihmu28g87r0kgd38dlrg3d.apps.googleusercontent.com',
      iosClientId: '398836187935-ia0u2mmotml5bqfm7u32tvuqhvobd5q1.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
