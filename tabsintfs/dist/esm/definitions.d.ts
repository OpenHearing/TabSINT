export interface TabsintFsPlugin {
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
    getDirectoryStructure(options: {
        rootUri: string;
        path?: string;
    }): Promise<{
        structure: any;
    }>;
    copyFileOrFolder(options: {
        rootUri: string;
        sourcePath: string;
        destinationPath: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    readFile(options: {
        rootUri: string;
        filePath: string;
    }): Promise<{
        contentUri: string;
        mimeType: string;
        name: string;
        size: number;
    }>;
}
