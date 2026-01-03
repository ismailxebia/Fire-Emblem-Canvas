import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.genoflow.fireemblem',
  appName: 'Fire Emblem Canvas',
  webDir: 'dist',
  android: {
    // Allow WebView to handle touch properly
    allowMixedContent: true
  },
  server: {
    // For debugging - allows Chrome DevTools
    androidScheme: 'https'
  }
};

export default config;
