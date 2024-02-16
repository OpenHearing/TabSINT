import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'tabsint',
  webDir: 'dist/tabsint/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
