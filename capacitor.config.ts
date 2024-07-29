import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'tabsint',
  webDir: 'dist/tabsint/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    TabsintFs: {
      android:'com.creare.tabsintfs.TabsintFsPlugin'
    }
  }
};

export default config;
