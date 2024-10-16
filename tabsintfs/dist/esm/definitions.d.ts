export interface TabsintFsPlugin {
    chooseFolder(): Promise<{
        uri: string;
        name: string;
    }>;
    createPath(options: {
        rootUri: string | null;
        path: string;
        content?: string;
    }): Promise<{
        uri: string;
    }>;
    getDirectoryStructure(options: {
        rootUri: string | null;
        path?: string;
    }): Promise<{
        structure: any;
    }>;
    copyFileOrFolder(options: {
        rootUri: string | null;
        sourcePath: string;
        destinationPath: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    readFile(options: {
        rootUri?: string | null;
        filePath?: string | undefined;
        fileUri?: string | undefined;
    }): Promise<{
        contentUri: string;
        mimeType: string;
        name: string;
        size: number;
        content: string;
    }>;
    deletePath(options: {
        rootUri: string | null;
        path: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    listFilesInDirectory(options: {
        rootUri?: string | null;
        folderPath?: string | undefined;
        folderUri?: string | undefined;
    }): Promise<{
        files: {
            name: string;
            uri: string;
            mimeType: string;
            size: number;
            content: string;
        }[];
    }>;
}
