import { registerPlugin } from '@capacitor/core';

import { TabsintAudioPlugin } from './definitions';

const TabsintAudio = registerPlugin<TabsintAudioPlugin>('TabsintAudio', {
  web: () => import('./web').then(m => new m.TabsintAudioWeb()),
});

export * from './definitions';
export { TabsintAudio };
