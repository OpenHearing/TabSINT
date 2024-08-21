export interface TabsintFsPlugin {
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
    getDirectoryStructure(options: {
        rootUri: string | undefined;
        path?: string;
    }): Promise<{
        structure: any;
    }>;
    copyFileOrFolder(options: {
        rootUri: string | undefined;
        sourcePath: string;
        destinationPath: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    readFile(options: {
        rootUri?: string | undefined;
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
        rootUri: string | undefined;
        path: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    listFilesInDirectory(options: {
        rootUri?: string | undefined;
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
