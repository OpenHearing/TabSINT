import { WebPlugin } from '@capacitor/core';

import type { TabsintFsPlugin } from './definitions';

export class TabsintFsWeb extends WebPlugin implements TabsintFsPlugin {
  async chooseFolder(): Promise<{ uri: string; name: string }> {
    console.log('chooseFile from web not implemented');
    return { uri: '', name: '' };
  }

  async createPath(options: { rootUri: string | null | undefined; path: string; content?: string; asBase64?: boolean }): Promise<{ uri: string }> {
    console.log('createPath not implemented for web', options);
    return { uri: '' };
  }

  async getDirectoryStructure(_options: { rootUri: string | null | undefined; path: string }): Promise<{ structure: any }> {
    console.log('getDirectoryStructure not implemented for web');
    return { structure: null };
  }

  async copyFileOrFolder(_options: {
    rootUri: string | null | undefined;
    sourcePath: string;
    destinationPath: string;
  }): Promise<{ success: boolean; message: string }> {
    console.log('copyFileOrFolder not implemented for web');
    return { success: false, message: 'Not implemented on web' };
  }

  async readFile(options: { rootUri?: string | null; fileUri?: string | null; filePath?: string | null; asBase64?: boolean | null }): Promise<{
    contentUri: string;
    mimeType: string;
    name: string;
    size: number;
    content: string;
  }> {
    console.log('readFile not implemented for web', options);
    return { contentUri: '', mimeType: '', name: '', size: 0, content: '' };
  }

  async getFileContentURI(options: { rootUri: string; filePath: string }): Promise<{ contentUri: string }> {
    console.log('getFileContentURI not implemented for web', options);
    return { contentUri: '' };
  }

  async deletePath(_options: { rootUri: string | null | undefined; path: string }): Promise<{ success: boolean; message: string }> {
    console.log('deletePath not implemented for web');
    return { success: false, message: 'Not implemented on web' };
  }

  async listFilesInDirectory(_options: { rootUri?: string | null; folderPath?: string | null; contentUri?: string | null }): Promise<{
    files: {
      name: string;
      uri: string;
      mimeType: string;
      size: number;
      content: string;
    }[];
  }> {
    console.log('listFilesInDirectory not implemented for web');
    return { files: [] };
  }
}
