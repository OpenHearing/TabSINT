import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creare.tabsintcha.demo',
  appName: 'demo',
  webDir: 'dist/demo/browser',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
    TabsintCha: {
      android: 'com.creare.tabsintcha.TabsintChaPlugin',
    },
  },
};

export default config;
