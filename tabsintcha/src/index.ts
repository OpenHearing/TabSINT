import { registerPlugin } from '@capacitor/core';

import type { TabsintChaPlugin } from './definitions';

const TabsintCha = registerPlugin<TabsintChaPlugin>('TabsintCha', {
  web: () => import('./web').then(m => new m.TabsintChaWeb()),
});

export * from './definitions';
export { TabsintCha };
