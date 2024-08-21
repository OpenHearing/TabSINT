var capacitorTabsintFs = (function (exports, core) {
    'use strict';

    const TabsintFs = core.registerPlugin('TabsintFs', {
        web: () => Promise.resolve().then(function () { return web; }).then(m => new m.TabsintFsWeb()),
    });

    class TabsintFsWeb extends core.WebPlugin {
        async chooseFolder() {
            console.log('chooseFile from web not implemented');
            return { uri: '', name: '' };
        }
        async createPath(options) {
            console.log('createPath not implemented for web', options);
            return { uri: '' };
        }
        async getDirectoryStructure(_options) {
            console.log('getDirectoryStructure not implemented for web');
            return { structure: null };
        }
        async copyFileOrFolder(_options) {
            console.log('copyFileOrFolder not implemented for web');
            return { success: false, message: 'Not implemented on web' };
        }
        async readFile(options) {
            console.log('readFile not implemented for web', options);
            return { contentUri: '', mimeType: '', name: '', size: 0, content: '' };
        }
        async deletePath(_options) {
            console.log('deletePath not implemented for web');
            return { success: false, message: 'Not implemented on web' };
        }
        async listFilesInDirectory(_options) {
            console.log('listFilesInDirectory not implemented for web');
            return { files: [] };
        }
    }

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        TabsintFsWeb: TabsintFsWeb
    });

    exports.TabsintFs = TabsintFs;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
