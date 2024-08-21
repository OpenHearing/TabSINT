import { registerPlugin } from '@capacitor/core';
const TabsintFs = registerPlugin('TabsintFs', {
    web: () => import('./web').then(m => new m.TabsintFsWeb()),
});
export * from './definitions';
export { TabsintFs };
//# sourceMappingURL=index.js.map