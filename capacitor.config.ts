import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creare.tabsint',
  appName: 'tabsint',
  webDir: 'dist/tabsint/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Permissions: {
      android: ["android.permission.READ_EXTERNAL_STORAGE","android.permission.WRITE_EXTERNAL_STORAGE"]
    },
    TabsintFs: {
      android: 'com.creare.tabsintfs.TabsintFsPlugin'
    }
  }
};

export default config;
