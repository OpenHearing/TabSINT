import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { TabsintFs } from 'tabsintfs';

import { AppInterface } from '../models/app/app.interface';
import { DiskInterface } from '../models/disk/disk.interface';

import { AppModel } from '../models/app/app.service';
import { Logger } from './logger.service';
import { DiskModel } from '../models/disk/disk.service';

import { listOfTabsintDirectories } from './constants';

@Injectable({
    providedIn: 'root',
})

export class FileService {
    app: AppInterface;
    rootUri:string | undefined;
    disk:DiskInterface;
    diskSubscription: Subscription | undefined;

    constructor(
        public appModel: AppModel,
        public logger: Logger,
        private readonly diskModel: DiskModel
    ) { 
        this.app = this.appModel.getApp();
        this.disk = this.diskModel.getDisk();
        this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        })    
        this.rootUri = this.disk.contentURI;
     }

    /**
     * Launches the file chooser and allows the user to select a folder.
     * @returns A promise containing the content URI and name of the selected folder.
     */
    async launchFileChooser() {
        let result = null;
        try{
            result = await TabsintFs.chooseFolder();
        } catch (error) {
            this.logger.error(""+error);
        }
        return result;
    }

    /**
     * Writes specified content to a file at the specified path.
     * @param path - The relative path where the file should be created or written.
     * @param data - The content to be written to the file.
     * @param rootDir - (Optional) The root directory where the file should be created. Default root directory is used if not specified
     * @returns A promise containing the content URI of the created or specified file.
     */
    async writeFile(path:string, data:string,rootDir:string|undefined=this.rootUri) {
        let result = null;
        try {
            result = data 
                ? await TabsintFs.createPath({rootUri:rootDir,path:path,content:data}) 
                : await TabsintFs.createPath({rootUri:rootDir,path:path});
            this.logger.debug("File created successfully at: " + result.uri);
        } catch (error) {
            this.logger.error("Failed to create file: " + error);
        }
        return result;
    };
    
    /**
     * Checks if the given input string is a content URI.
     * @param input - The string to check.
     * @returns A promise that resolves to true if the input is a content URI, otherwise false.
     */
    async isContentUri(input:string|undefined) {
        return input?.startsWith('content://com.android');
    }

    /**
     * Reads the content from a specified file path or content URI.
     * Must specify either contentURI or file path for it to work successfully and avoid errors.
     * @param path - (Optional) The relative path to the file.
     * @param contentUri - (Optional) The content URI of the file.
     * @param rootDir - (Optional) The root directory where the file is located. Default root directory (Documents directory in most cases) is used if not specified.
     * @returns A promise containing the file details such as content URI, MIME type, name, size, and content.
    */
    async readFile(input:string|undefined,rootDir:string|undefined=this.rootUri) {
        let result = null;
        try{
            result = await this.isContentUri(input) 
                ? await TabsintFs.readFile({rootUri:rootDir,filePath:undefined,fileUri:input}) 
                : await TabsintFs.readFile({rootUri:rootDir,filePath:input,fileUri:undefined});
            this.logger.debug(JSON.stringify(result));
            return result;
        } 
        catch (error) {
            this.logger.error("Failed to read file: " + error);
        }
        return result;
    };

    /**
     * Creates a directory at the specified path.
     * @param path - The relative path where the directory should be created.
     * @param rootDir - (Optional) The root directory where the file is located. Default root directory (Documents directory in most cases) is used if not specified.
     * @returns A promise containing the content URI of the created directory.
    */
    async createDirectory(path: string, rootDir: string|undefined = this.rootUri) {
        let result = null;

        try {
            result = await TabsintFs.createPath({rootUri:rootDir,path:path});
            this.logger.debug(JSON.stringify(result));
            this.logger.debug("Folder created successfully at: " + result.uri);
        } catch (error) {
            this.logger.error("Failed to create folder: " + error);
        }

        return result;
    }

    /**
     * Copies a directory from a source path to a destination path.
     * Creates destinationPath if it does not exist but source path must exist to avoid errors.
     * @param sourcePath - The source directory path.
     * @param destinationPath - The destination directory path.
     * @param rootDir - (Optional) The root directory where the source and destination folders are located. Default root directory (Documents directory in most cases) is used if not specified.
     * @returns A promise containing the status of the copy operation.
    */
    async copyDirectory(sourcePath:string, destinationPath:string, rootDir:string|undefined=this.rootUri) {
        let result = null;
        try {
            result = await TabsintFs.copyFileOrFolder({rootUri:rootDir,sourcePath:sourcePath,destinationPath:destinationPath});
            this.logger.debug(JSON.stringify(result));
            this.logger.debug("Successfully copied file/folder content");
        } catch(error) {
            this.logger.error("Error copying file/folder"+ error);
        }
        return result;
    }

    /**
     * Ensures that directories used by the application exist in the Documents folder.
     * @private
     * @summary This method creates directories used by the application if they do not already exist.
     */
    public async createTabsintDirectoriesIfDontExist() {
        //TODO: check if directories exist before we add them
        listOfTabsintDirectories.forEach((dir: string) => {
            this.createDirectory(dir);
        })
    }

    /**
     * Deletes a directory or file at the specified path.
     * @param path - The relative path to the directory or file to be deleted.
     * @param rootDir - (Optional) The root directory where the file is located. Default root directory (Documents directory in most cases) is used if not specified.
     * @returns A promise containing the status of the delete operation.
    */
    async deleteDirectory(path:string,rootDir:string|undefined=this.rootUri) {
        let result = null;
        try{
            result = await TabsintFs.deletePath({rootUri:rootDir,path:path});
            this.logger.debug(JSON.stringify(result));
            this.logger.debug("Successfully deleted specified folder/file");
        } catch (error) {
            this.logger.error("Failed to delete specified file/folder with " + error);
        }
        return result;
    }

    /**
     * Lists the files in a specified directory by either path or content URI.
     * Must specify either the path or the contentUri to avoid errors.
     * @param input - The relative path to the directory or content URI.
     * @param rootDir - (Optional) The root directory where the file is located. Default root directory (Documents directory in most cases) is used if not specified.
     * @returns A promise containing an array of files in the specified directory.
    */
    async listDirectory(input:string|undefined,rootDir:string|undefined=this.rootUri) {
        let result = null;
        try{
            result = await this.isContentUri(input) 
                ? await TabsintFs.listFilesInDirectory({rootUri:rootDir,folderPath:undefined,folderUri:input}) 
                : await TabsintFs.listFilesInDirectory({rootUri:rootDir,folderPath:input,folderUri:undefined});
            this.logger.debug(JSON.stringify(result));
            this.logger.debug("Successfully listed all files");
        } catch (error) {
            this.logger.error("Failed to list files " + error);
        }
        return result;
    }

}