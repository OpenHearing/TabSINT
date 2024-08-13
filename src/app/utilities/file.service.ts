import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { AppInterface } from '../models/app/app.interface';
import { AppModel } from '../models/app/app.service';
import { Logger } from './logger.service';
import { listOfTabsintDirectories } from './constants';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { TabsintFs } from 'tabsintfs';
import { result } from 'lodash';

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
        this.createTabsintDirectoriesIfDontExist(); 
        this.disk = this.diskModel.getDisk()
        this.rootUri = this.disk.contentURI     
     }

    directoryHandler(rootDir:string|undefined=this.rootUri) {
        /* Convert string dir to Filesystem directory plugin. Defaults to Documents. */
        let directory;
        if (rootDir=='Data') {
            directory = Directory.Data;
        } else if (rootDir=='Documents') {
            directory = Directory.Documents;
        } else if (rootDir=='Library') {
            directory = Directory.Library;
        } else if (rootDir=='Cache') {
            directory = Directory.Cache;
        } else if (rootDir=='External') {
            directory = Directory.External;
        } else if (rootDir=='ExternalStorage') {
            directory = Directory.ExternalStorage;
        } else if (rootDir==undefined) {
            directory = Directory.Documents;
        } else {
            this.logger.debug("Invalid rootDir in directoryHandler, defaulting to Documents");
            directory = Directory.Documents;
        }
        return directory;
    }

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

    async launchFileChooser(){
        try{
            let result = await TabsintFs.chooseFolder();
        } catch (error){
            this.logger.error(""+error)
        }
        return result
    }

    async writeFile(path:string, data:string, rootDir:string|undefined=this.rootUri) {
        try {
            let result = data ? await TabsintFs.createPath({rootUri:rootDir,path:path,content:data}) : await TabsintFs.createPath({rootUri:this.rootUri,path:path})
            this.logger.debug("File created successfully at: " + result.uri);
        } catch (error){
            this.logger.error("Failed to create file: " + error);
        }
        return result
    };
      
    async readFile(path:string | undefined = undefined, rootDir:string|undefined=this.rootUri, contentUri:string|undefined=undefined) {
        try{
            let result = await TabsintFs.readFile({fileUri:contentUri,rootUri:rootDir,filePath:path})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Read file from specified path with content -- " + result.content)
        } 
        catch (error){
            this.logger.error("Failed to read file: " + error);
        }
        return result
    };

    async createDirectory(path:string, rootDir:string|undefined=this.rootUri) {
        try {
            let result = await TabsintFs.createPath({rootUri:this.rootUri,path:path})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Folder created successfully at: " + result.uri);
        } catch (error){
            this.logger.error("Failed to create folder: " + error);
        }
        return result
    }

    async copyDirectory(rootDir:string|undefined=this.rootUri,sourcePath:string,destinationPath:string) {
        try{
            let result = await TabsintFs.copyFileOrFolder({rootUri:rootDir,sourcePath:sourcePath,destinationPath:destinationPath})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Successfully copied file/folder content")
        } catch(error){
            this.logger.error("Error copying file/folder"+ error);
        }
        return result
    }

    private async createTabsintDirectoriesIfDontExist() {
        listOfTabsintDirectories.forEach((dir: string) => {
            this.createDirectory(dir,this.rootUri);
        })
    }
    
    async deleteDirectory(path:string, rootDir:string|undefined=this.rootUri) {
        try{
            let result = await TabsintFs.deletePath({rootUri:rootDir,path:path})
            this.logger.debug(JSON.stringify(result))
            this.logger.debug("Successfully deleted specified folder/file")
        } catch (error){
            this.logger.error("Failed to delete specified file/folder with " + error)
        }
        return result
    }

    async listDirectory(path:string|undefined=undefined, rootDir:string|undefined=this.rootUri,contentUri:string|undefined=undefined) {
        try{
            let result = await TabsintFs.listFilesInDirectory({rootUri:rootDir,folderPath:path,contentUri:contentUri})
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

    // private async createDirectoryifDoesntExist(dir: string, rootDir: string = "", path: string = dir) {
    //     if (this.app.tablet) {
    //         this.existingDirectories = await this.listDirectory(rootDir);
    //         if (!this.doesDirectoryExist(dir)) {
    //             await this.createDirectory(path);
    //         } 
    //     }   
    // }            
}