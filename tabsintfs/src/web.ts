import { WebPlugin } from '@capacitor/core';

import type { TabsintFsPlugin } from './definitions';

export class TabsintFsWeb extends WebPlugin implements TabsintFsPlugin {
  async chooseFolder(): Promise<{ uri: string }> {
    console.log('chooseFile from web not implemented');
    return { uri: '' }; // Returning an empty string as a placeholder
  }

  async createPath(options: { rootUri: string; path: string; content?: string }): Promise<{ uri: string }> {
    console.log('createPath not implemented for web', options);
    return { uri: '' };
  }

  async getDirectoryStructure(_options: { rootUri: string; path: string }): Promise<{ structure: any }> {
    console.log('getDirectoryStructure not implemented for web');
    return { structure: null };
  }

  async copyFileOrFolder(_options: { rootUri: string; sourcePath: string; destinationPath: string }): Promise<{ success: boolean; message: string }> {
    console.log('copyFileOrFolder not implemented for web');
    return { success: false, message: 'Not implemented on web' };
  }

  async readFile(_options: { rootUri: string; filePath: string }): Promise<{ contentUri: string; mimeType: string; name: string; size: number }> {
    console.log('readFile not implemented for web');
    return { contentUri: '', mimeType: '', name: '', size: 0 };
  }
}
