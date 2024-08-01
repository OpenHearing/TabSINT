import { WebPlugin } from '@capacitor/core';
export class TabsintFsWeb extends WebPlugin {
    async chooseFolder() {
        console.log('chooseFile from web not implemented');
        return { uri: '' }; // Returning an empty string as a placeholder
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
    async readFile(_options) {
        console.log('readFile not implemented for web');
        return { contentUri: '', mimeType: '', name: '', size: 0 };
    }
}
//# sourceMappingURL=web.js.map