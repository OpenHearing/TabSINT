import { WebPlugin } from '@capacitor/core';

import type { TabsintFsPlugin } from './definitions';

export class TabsintFsWeb extends WebPlugin implements TabsintFsPlugin {
  async chooseFolder(): Promise<{ uri: string,name: string }> {
    console.log('chooseFile from web not implemented');
    return { uri: '', name: '' };
  }

  async createPath(options: { rootUri: string | undefined; path: string; content?: string }): Promise<{ uri: string }> {
    console.log('createPath not implemented for web', options);
    return { uri: '' };
  }

  async getDirectoryStructure(_options: { rootUri: string | undefined; path: string }): Promise<{ structure: any }> {
    console.log('getDirectoryStructure not implemented for web');
    return { structure: null };
  }

  async copyFileOrFolder(_options: { rootUri: string | undefined; sourcePath: string; destinationPath: string }): Promise<{ success: boolean; message: string }> {
    console.log('copyFileOrFolder not implemented for web');
    return { success: false, message: 'Not implemented on web' };
  }

  async readFile(_options: { rootUri: string | undefined; filePath: string }): Promise<{ contentUri: string; mimeType: string; name: string; size: number;content:string }> {
    console.log('readFile not implemented for web');
    return { contentUri: '', mimeType: '', name: '', size: 0,content:''};
  }

  async deletePath(_options: { rootUri: string | undefined; path: string }): Promise<{ success: boolean; message: string }> {
    console.log('deletePath not implemented for web');
    return { success: false, message: 'Not implemented on web' };
  }

  async listFilesInDirectory(_options: { rootUri: string | undefined; folderPath: string }): Promise<{ files: { name: string; uri: string; mimeType: string; size: number; content: string }[] }> {
    console.log('listFilesInDirectory not implemented for web');
    return { files: [] };
  }

  async readFileFromContentUri(_options: { fileUri: string }): Promise<{ content: string }> {
    console.log('readFileFromContentUri not implemented for web');
    return { content: '' };
  }
}
