import { WebPlugin } from '@capacitor/core';
import type { TabsintFsPlugin } from './definitions';
export declare class TabsintFsWeb extends WebPlugin implements TabsintFsPlugin {
    chooseFolder(): Promise<{
        uri: string;
        name: string;
    }>;
    createPath(options: {
        rootUri: string;
        path: string;
        content?: string;
    }): Promise<{
        uri: string;
    }>;
    getDirectoryStructure(_options: {
        rootUri: string;
        path: string;
    }): Promise<{
        structure: any;
    }>;
    copyFileOrFolder(_options: {
        rootUri: string;
        sourcePath: string;
        destinationPath: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    readFile(_options: {
        rootUri: string;
        filePath: string;
    }): Promise<{
        contentUri: string;
        mimeType: string;
        name: string;
        size: number;
    }>;
}
