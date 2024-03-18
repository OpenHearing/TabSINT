import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding, ReadFileResult } from '@capacitor/filesystem';
import { Logger } from '../utilities/logger.service';
import { from, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

export class FileService {

    constructor(public logger:Logger) {  }

    directoryHandler(dirLoc?:string) {
        /* Convert string dir to Filesystem directoyr plugin. Defaults to Documents. */
        let directory;
        if (dirLoc=='Data') {
            directory = Directory.Data;
        } else if (dirLoc=='Data') {
            directory = Directory.Data;
        } else if (dirLoc=='Documents') {
            directory = Directory.Documents;
        } else if (dirLoc=='Library') {
            directory = Directory.Library;
        } else if (dirLoc=='Cache') {
            directory = Directory.Cache;
        } else if (dirLoc=='External') {
            directory = Directory.External;
        } else if (dirLoc=='ExternalStorage') {
            directory = Directory.ExternalStorage;
        } else if (dirLoc==undefined) {
            directory = Directory.Documents;
        }
        return directory
    }

    async checkPermissions() {
        const requestPermissionsObs = from(Filesystem.checkPermissions());
        requestPermissionsObs.subscribe({
            next: (res) => {
                this.logger.debug("Checked file permissions: "+JSON.stringify(res));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (checkPermisions)");
                console.log(err)
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    }
    
    async requestPermissions() {        
        const requestPermissionsObs = from(Filesystem.requestPermissions());
        requestPermissionsObs.subscribe({
            next: (res) => {
                this.logger.debug("Requested file permissions: "+JSON.stringify(res));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (requestPermisions)");
                console.log(err)
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    }

    writeFile(filepath:string, data:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        const writeFileObs = from(Filesystem.writeFile({
            path: filepath,
            data: data,
            directory: directory,
            encoding: Encoding.UTF8,
        }));
        // writeFileObs.subscribe({
        //     next: () => {
        //         this.logger.debug('Wrote data to '+JSON.stringify(filepath));
        //         console.log("next: observable worked");
        //     }, 
        //     error: (err) => {
        //         console.log("error: observable error (writeFile)");
        //         console.log(err)
        //     },
        //     complete() {
        //         console.log("complete: observable completed. this will only appear after directory created if there is no error.");
        //     }
        // });
        return writeFileObs
    };
      
    readFile(filepath:string, dirLoc?:string) {
        // let fileContents: any;
        let directory = this.directoryHandler(dirLoc);
        const readFileObs = from(Filesystem.readFile({
            path: filepath,
            directory: directory,
            encoding: Encoding.UTF8,
        }));
        // readFileObs.subscribe({
        //     next: (contents) => {
        //         this.logger.debug('Reading '+JSON.stringify(filepath)+', file contents: '+JSON.stringify(contents));
        //         fileContents = contents;
        //         console.log("next: observable worked");
        //     }, 
        //     error: (err) => {
        //         console.log("error: observable error (readFile)");
        //         console.log(err)
        //     },
        //     complete() {
        //         console.log("complete: observable completed. this will only appear after directory created if there is no error.");
        //     }
        // });
        // return fileContents
        return readFileObs
    };

    createDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        const createDirObs = from(Filesystem.mkdir({
            path: dir,
            directory: directory,
        }));
        // createDirObs.subscribe({
        //     next: () => {
        //         this.logger.debug('Directory: '+JSON.stringify(dir)+' created');
        //         console.log("next: observable worked");
        //     }, 
        //     error: (err) => {
        //         console.log("error: observable error");
        //         if (err.message=='Directory exists') {
        //             this.logger.debug('Directory: '+JSON.stringify(dir)+' already exists');
        //         } else {
        //             this.logger.debug('Error creating directory '+JSON.stringify(dir));
        //         }
        //     },
        //     complete() {
        //         console.log("complete: observable completed. this will only appear after directory created if there is no error.");
        //     }
        // });
        return createDirObs
    }

    deleteDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        const deleteDirObs = from(Filesystem.rmdir({
            path: dir,
            directory: directory,
        }));
        // deleteDirObs.subscribe({
        //     next: () => {
        //         this.logger.debug('Deleted directory: '+JSON.stringify(dir));
        //         console.log("next: observable worked");
        //     }, 
        //     error: (err) => {
        //         console.log("error: observable error (deleteDirectory)");
        //         console.log(err);
        //     },
        //     complete() {
        //         console.log("complete: observable completed. this will only appear after directory created if there is no error.");
        //     }
        // });
        return deleteDirObs
    }

    listDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        const listDirObs = from(Filesystem.readdir({
            path: dir,
            directory: directory,
        }));
        // listDirObs.subscribe({
        //     next: (files) => {
        //         this.logger.debug('List of files in dir: '+JSON.stringify(files));
        //         console.log("next: observable worked");
        //     }, 
        //     error: (err) => {
        //         console.log("error: observable error (listDirectory)");
        //         console.log(err);
        //     },
        //     complete() {
        //         console.log("complete: observable completed. this will only appear after directory created if there is no error.");
        //     }
        // });
        return listDirObs
    }
    
}