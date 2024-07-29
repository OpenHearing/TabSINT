import { registerPlugin } from '@capacitor/core';

import type { TabsintFsPlugin } from './definitions';

const TabsintFs = registerPlugin<TabsintFsPlugin>('TabsintFs', {
  web: () => import('./web').then(m => new m.TabsintFsWeb()),
});

export * from './definitions';
export { TabsintFs };
