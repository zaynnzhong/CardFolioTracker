import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prismcards.portfolio',
  appName: 'Prism Portfolio',
  webDir: 'dist',
  server: {
    // Production URL - your deployed website
    url: 'https://prism-cards.com',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#000000',
    allowsLinkPreview: false,
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
    }
  }
};

export default config;
