import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AppInterface } from '../models/app/app.interface';
import { AppModel } from '../models/app/app.service';
import { Logger } from './logger.service';
import { listOfTabsintDirectories } from './constants';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { TabsintFs } from 'tabsintfs';

@Injectable({
    providedIn: 'root',
})

export class FileService {
    app: AppInterface;
    rootUri:string | undefined
    existingDirectories: any;
    disk:DiskInterface

    constructor(
        public appModel: AppModel,
        public logger:Logger,
        private diskModel:DiskModel
    ) { 
        this.app = this.appModel.getApp();
        this.disk = this.diskModel.getDisk()
        this.rootUri = this.disk.contentURI
        this.createTabsintDirectoriesIfDontExist();   
     }

    // directoryHandle) {
    //     /* Convert string dir to Filesystem directory plugin. Defaults to Documents. */
    //     let directory;
    //     if (rootDir=='Data') {
    //         directory = Directory.Data;
    //     } else if (rootDir=='Documents') {
    //         directory = Directory.Documents;
    //     } else if (rootDir=='Library') {
    //         directory = Directory.Library;
    //     } else if (rootDir=='Cache') {
    //         directory = Directory.Cache;
    //     } else if (rootDir=='External') {
    //         directory = Directory.External;
    //     } else if (rootDir=='ExternalStorage') {
    //         directory = Directory.ExternalStorage;
    //     } else if (rootDir==undefined) {
    //         directory = Directory.Documents;
    //     } else {
    //         this.logger.debug("Invalid rootDir in directoryHandler, defaulting to Documents");
    //         directory = Directory.Documents;
    //     }
    //     return directory;
    // }

    // async checkPermissions() {
    //     return Filesystem.checkPermissions().then( (res)=> {
    //         this.logger.debug("Checked file permissions: "+JSON.stringify(res));
    //     });
    // }
    
    // async requestPermissions() {
    //     return Filesystem.requestPermissions().then( (res)=> {
    //         this.logger.debug("Requested file permissions: "+JSON.stringify(res));
    //     });
    // }

    /**
     * Launches the file chooser and allows the user to select a folder.
     * @returns A promise containing the content URI and name of the selected folder.
     */
    async launchFileChooser(){
        let result = null
        try{
            result = await TabsintFs.chooseFolder();
        } catch (error){
            this.logger.error(""+error)
        }
        return result
    }

    /**
     * Writes specified content to a file at the specified path.
     * @param path - The relative path where the file should be created or written.
     * @param data - The content to be written to the file.
     * @returns A promise containing the content URI of the created or specified file.
     */
    async writeFile(path:string, data:string,rootDir:string|undefined=this.rootUri) {
        let result = null
        try {
            result = data ? await TabsintFs.createPath({rootUri:rootDir,path:path,content:data}) : await TabsintFs.createPath({rootUri:rootDir,path:path})
            this.logger.debug("File created successfully at: " + result.uri);
        } catch (error){
            this.logger.error("Failed to create file: " + error);
        }
        return result
    };
    
    
    async isContentUri(input:string|undefined){
        return input?.startsWith('content://com.android')
    }

    /**
     * Reads the content from a specified file path or content URI. Must specify either contentURI or file path for it to work successfully and avoid errors
     * @param path - (Optional) The relative path to the file.
     * @param contentUri - (Optional) The content URI of the file.
     * @returns A promise containing the file details such as content URI, MIME type, name, size, and content.
     */
    async readFile(input:string|undefined,rootDir:string|undefined=this.rootUri) {
        let result = null
        try{
            result = await this.isContentUri(input) ? await TabsintFs.readFile({rootUri:rootDir,filePath:undefined,fileUri:input}) : await TabsintFs.readFile({rootUri:rootDir,filePath:input,fileUri:undefined})
            this.logger.debug(JSON.stringify(result))
            return result
        } 
        catch (error){
            this.logger.error("Failed to read file: " + error);
        }
        return result
    };
    /**
     * Creates a directory at the specified path.
     * @param path - The relative path where the directory should be created.
     * @returns A promise containing the content URI of the created directory.
     */
    async createDirectory(path:string,rootDir:string|undefined=this.rootUri) {
        let result = null
        try {
            result = await TabsintFs.createPath({rootUri:rootDir,path:path})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Folder created successfully at: " + result.uri);
        } catch (error){
            this.logger.error("Failed to create folder: " + error);
        }
        return result
    }
    /**
     * Copies a directory from a source path to a destination path. Creates destinationPath if it does not exist but source path must exist to avoid errors
     * @param sourcePath - The source directory path.
     * @param destinationPath - The destination directory path.
     * @returns A promise containing the status of the copy operation.
     */
    async copyDirectory(sourcePath:string,destinationPath:string,rootDir:string|undefined=this.rootUri) {
        let result = null
        try{
            result = await TabsintFs.copyFileOrFolder({rootUri:rootDir,sourcePath:sourcePath,destinationPath:destinationPath})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Successfully copied file/folder content")
        } catch(error){
            this.logger.error("Error copying file/folder"+ error);
        }
        return result
    }

    /**
     * Ensures that directories used by the application exist in the Documents folder.
     * @private
     * @summary This method creates directories used by the application if they do not already exist.
     */
    public async createTabsintDirectoriesIfDontExist() {
        listOfTabsintDirectories.forEach((dir: string) => {
            this.createDirectory(dir);
        })
    }

    /**
     * Deletes a directory or file at the specified path.
     * @param path - The relative path to the directory or file to be deleted.
     * @returns A promise containing the status of the delete operation.
     */
    async deleteDirectory(path:string,rootDir:string|undefined=this.rootUri) {
        let result = null
        try{
            result = await TabsintFs.deletePath({rootUri:rootDir,path:path})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Successfully deleted specified folder/file")
        } catch (error){
            this.logger.error("Failed to delete specified file/folder with " + error)
        }
        return result
    }
    /**
     * Lists the files in a specified directory by either path or content URI. Must specify either the path or the contentUri to avoid errors
     * @param path - (Optional) The relative path to the directory.
     * @param contentUri - (Optional) The content URI of the directory.
     * @returns A promise containing an array of files in the specified directory.
     */
    async listDirectory(input:string|undefined,rootDir:string|undefined=this.rootUri) {
        let result = null
        try{
            result = await this.isContentUri(input) ? await TabsintFs.listFilesInDirectory({rootUri:rootDir,folderPath:undefined,folderUri:input}) : await TabsintFs.listFilesInDirectory({rootUri:rootDir,folderPath:input,folderUri:undefined})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Successfully listed all files")
        } catch (error){
            this.logger.error("Failed to list files " + error)
        }
        return result
    }

    /**
     * Make sure the full path exists on the tablet before writing to it.
     * @summary List the directories on the full path, recursively. For each, check if it exists and if not, create it.
     * @param path Full path, from "Internal Storage/Documents".
     */
    // private async ensurePathExists(path: string) {
    //     let parentDirectoriesList = path.split("/").slice(0,-1);
    //     if (parentDirectoriesList.length > 1) {
    //         this.createDirectoryifDoesntExist(parentDirectoriesList[0]);
    //         for (var i = 0; i < parentDirectoriesList.length-1; i++) {
    //             this.existingDirectories = await this.listDirectory(parentDirectoriesList[i]);
    //             await this.createDirectoryifDoesntExist(
    //                 parentDirectoriesList[i+1], 
    //                 parentDirectoriesList[i], 
    //                 parentDirectoriesList.slice(0,i+2).join("/")
    //             );
    //         }
    //     }
    // }

    /**
     * Create directories used by tabsint in the Documents folder when first installing the app.
     * @summary Iterate through each directory expected by tabsint in the Documents folder. If it doesn't exist, create it.
     */

    
    // private doesDirectoryExist(name: string): boolean {
    //     return this.existingDirectories.files.some((file: any) => file.name === name);
    //   }

    // private async createDirectoryifDoesntExist(dir: string, this.rootUri: string = "", path: string = dir) {
    //     if (this.app.tablet) {
    //         this.existingDirectories = await this.listDirectory(rootDir);
    //         if (!this.doesDirectoryExist(dir)) {
    //             await this.createDirectory(path);
    //         } 
    //     }   
    // }            
}