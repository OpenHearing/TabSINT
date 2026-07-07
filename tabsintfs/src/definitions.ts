export interface TabsintFsPlugin {
  chooseFolder(): Promise<{ uri: string; name: string }>;
  createPath(options: { rootUri: string | null | undefined; path: string; content?: string; asBase64?: boolean }): Promise<{ uri: string }>;
  getDirectoryStructure(options: { rootUri: string | null | undefined; path?: string }): Promise<{ structure: any }>;
  copyFileOrFolder(options: {
    rootUri: string | null | undefined;
    sourcePath: string;
    destinationPath: string;
  }): Promise<{ success: boolean; message: string }>;
  readFile(options: { rootUri?: string | null; filePath?: string | null; fileUri?: string | null; asBase64?: boolean | null }): Promise<{
    contentUri: string;
    mimeType: string;
    name: string;
    size: number;
    content: string;
  }>;
  getFileContentURI(options: { rootUri: string; filePath: string }): Promise<{ contentUri: string }>;
  deletePath(options: { rootUri: string | null | undefined; path: string }): Promise<{ success: boolean; message: string }>;
  listFilesInDirectory(options: { rootUri?: string | null; folderPath?: string | null; folderUri?: string | null }): Promise<{
    files: {
      name: string;
      uri: string;
      mimeType: string;
      size: number;
      content: string;
    }[];
  }>;
  unzip(options: { sourcePath: string; destinationPath: string; ignoreRoot: boolean }): Promise<{ success: boolean; message: string }>;
}
