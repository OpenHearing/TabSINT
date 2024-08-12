import { WebPlugin } from '@capacitor/core';
import type { TabsintFsPlugin } from './definitions';
export declare class TabsintFsWeb extends WebPlugin implements TabsintFsPlugin {
    chooseFolder(): Promise<{
        uri: string;
        name: string;
    }>;
    createPath(options: {
        rootUri: string | undefined;
        path: string;
        content?: string;
    }): Promise<{
        uri: string;
    }>;
    getDirectoryStructure(_options: {
        rootUri: string | undefined;
        path: string;
    }): Promise<{
        structure: any;
    }>;
    copyFileOrFolder(_options: {
        rootUri: string | undefined;
        sourcePath: string;
        destinationPath: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    readFile(_options: {
        rootUri: string | undefined;
        filePath: string;
    }): Promise<{
        contentUri: string;
        mimeType: string;
        name: string;
        size: number;
        content: string;
    }>;
    deletePath(_options: {
        rootUri: string | undefined;
        path: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    listFilesInDirectory(_options: {
        rootUri: string | undefined;
        folderPath: string;
    }): Promise<{
        files: {
            name: string;
            uri: string;
            mimeType: string;
            size: number;
            content: string;
        }[];
    }>;
    readFileFromContentUri(_options: {
        fileUri: string;
    }): Promise<{
        content: string;
    }>;
}
