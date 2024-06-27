import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { AppInterface } from '../models/app/app.interface';
import { AppModel } from '../models/app/app.service';

import { Logger } from './logger.service';
import { listOfTabsintDirectories } from './constants';
@Injectable({
    providedIn: 'root',
})

export class FileService {
    app: AppInterface;
    
    existingDirectories: any;

    constructor(
        public appModel: AppModel,
        public logger:Logger
    ) { 
        this.app = this.appModel.getApp();
        this.createTabsintDirectoriesIfDontExist();        
     }

    directoryHandler(rootDir?:string) {
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

    async checkPermissions() {
        return Filesystem.checkPermissions().then( (res)=> {
            this.logger.debug("Checked file permissions: "+JSON.stringify(res));
        });
    }
    
    async requestPermissions() {
        return Filesystem.requestPermissions().then( (res)=> {
            this.logger.debug("Requested file permissions: "+JSON.stringify(res));
        });
    }

    async writeFile(path:string, data:string, rootDir?:string) {
        let directory = this.directoryHandler(rootDir);
        this.logger.debug("Writing to: "+path);
        await this.ensurePathExists(path);
        return Filesystem.writeFile({
            path: path,
            data: data,
            directory: directory,
            encoding: Encoding.UTF8,
        }).then( (res)=> {
            this.logger.debug("Wrote to: "+path);
            return res
        }).catch( (err)=> {
            this.logger.error("Error writing to "+path+" - "+err);
        });
    };
      
    async readFile(path:string, rootDir?:string) {
        let directory = this.directoryHandler(rootDir);
        this.logger.debug("Reading from: "+path);
        return Filesystem.readFile({
            path: path,
            directory: directory,
            encoding: Encoding.UTF8,
        }).then( (res)=> {
            this.logger.debug("Read file: "+path);
            return res
        }).catch( (err)=> {
            this.logger.error("Error reading "+path+" - "+err);
        });
    };

    async createDirectory(path:string, rootDir?:string) {
        let directory = this.directoryHandler(rootDir);
        this.logger.debug("Creating dir: "+path);
        return Filesystem.mkdir({
            path: path,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Created dir: "+path);
        }).catch( (err)=> {
            this.logger.error("Error creating dir "+path+" - "+err);
        });
    }

    async deleteDirectory(path:string, rootDir?:string) {
        let directory = this.directoryHandler(rootDir);
        this.logger.debug("Deleting dir: "+path);
        return Filesystem.rmdir({
            path: path,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Deleted dir: "+path);
            return res
        }).catch( (err)=> {
            this.logger.error("Error deleting dir "+path+" - "+err);
        });
    }

    async listDirectory(path:string, rootDir?:string) {
        let directory = this.directoryHandler(rootDir);
        this.logger.debug("Listing dir: "+path);
        return Filesystem.readdir({
            path: path,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Listed dirs: "+ path);
            return res
        }).catch( (err)=> {
            this.logger.error("Error listing dir "+path+" - "+err);
        });
    }

    async copyDirectory(from: string, to: string, rootDirFrom: string, rootDirTo: string) {
        let directoryFrom = this.directoryHandler(rootDirFrom);
        let directoryTo = this.directoryHandler(rootDirTo);
        this.logger.debug("Copying directory from: " + from + " to: " + to);
        return Filesystem.copy({
            from: from,
            to: to,
            directory: directoryFrom,
            toDirectory: directoryTo
        }).then( (res)=> {
            this.logger.debug("Copied dir from: " + from + " to: " + to);
            return res
        }).catch( (err)=> {
            this.logger.error("Error copying dir from: " + from + " to: " + to);
        });
    }
    
    /**
     * Make sure the full path exists on the tablet before writing to it.
     * @summary List the directories on the full path, recursively. For each, check if it exists and if not, create it.
     * @param path Full path, from "Internal Storage/Documents".
     */
    private async ensurePathExists(path: string) {
        let parentDirectoriesList = path.split("/").slice(0,-1);
        if (parentDirectoriesList.length > 1) {
            this.createDirectoryifDoesntExist(parentDirectoriesList[0]);
            for (var i = 0; i < parentDirectoriesList.length-1; i++) {
                this.existingDirectories = await this.listDirectory(parentDirectoriesList[i]);
                await this.createDirectoryifDoesntExist(
                    parentDirectoriesList[i+1], 
                    parentDirectoriesList[i], 
                    parentDirectoriesList.slice(0,i+2).join("/")
                );
            }
        }
    }

    /**
     * Create directories used by tabsint in the Documents folder when first installing the app.
     * @summary Iterate through each directory expected by tabsint in the Documents folder. If it doesn't exist, create it.
     */
    private async createTabsintDirectoriesIfDontExist() {
        listOfTabsintDirectories.forEach((dir: string) => {
            this.createDirectoryifDoesntExist(dir);
        })
    }
    
    private doesDirectoryExist(name: string): boolean {
        return this.existingDirectories.files.some((file: any) => file.name === name);
      }

    private async createDirectoryifDoesntExist(dir: string, rootDir: string = "", path: string = dir) {
        if (this.app.tablet) {
            this.existingDirectories = await this.listDirectory(rootDir);
            if (!this.doesDirectoryExist(dir)) {
                await this.createDirectory(path);
            } 
        }   
    }            
}