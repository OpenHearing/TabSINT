import { registerPlugin } from '@capacitor/core';
const TabsintCha = registerPlugin('TabsintCha', {
    web: () => import('./web').then(m => new m.TabsintChaWeb()),
});
export * from './definitions';
export { TabsintCha };
//# sourceMappingURL=index.js.map