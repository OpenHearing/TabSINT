import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Logger } from '../utilities/logger.service';
import { from, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

export class FileService {

    constructor(public logger:Logger) {  }

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

    async writeFile(filepath:string, data:string) {
        const writeFileObs = from(Filesystem.writeFile({
            path: filepath,
            data: data,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        }));
        writeFileObs.subscribe({
            next: () => {
                this.logger.debug('Wrote data to '+JSON.stringify(filepath));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (writeFile)");
                console.log(err)
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    };
      
    async readFile(filepath:string) {
        const readFileObs = from(Filesystem.readFile({
            path: filepath,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
        }));
        readFileObs.subscribe({
            next: (contents) => {
                this.logger.debug('Reading '+JSON.stringify(filepath)+', file contents: '+JSON.stringify(contents));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (readFile)");
                console.log(err)
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    };

    createDirectory(dir:string) {
        const createDirObs = from(Filesystem.mkdir({
            path: dir,
            directory: Directory.Documents,
        }));
        createDirObs.subscribe({
            next: () => {
                this.logger.debug('Directory: '+JSON.stringify(dir)+' created');
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error");
                if (err.message=='Directory exists') {
                    this.logger.debug('Directory: '+JSON.stringify(dir)+' already exists');
                } else {
                    this.logger.debug('Error creating directory '+JSON.stringify(dir));
                }
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    }

    async deleteDirectory(dir:string) {
        const deleteDirObs = from(Filesystem.rmdir({
            path: dir,
            directory: Directory.Documents,
        }));
        deleteDirObs.subscribe({
            next: () => {
                this.logger.debug('Deleted directory: '+JSON.stringify(dir));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (deleteDirectory)");
                console.log(err);
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    }

    async listDirectory(dir:string) {
        const listDirObs = from(Filesystem.readdir({
            path: dir,
            directory: Directory.Documents,
        }));
        listDirObs.subscribe({
            next: (files) => {
                this.logger.debug('List of files in dir: '+JSON.stringify(files));
                console.log("next: observable worked");
            }, 
            error: (err) => {
                console.log("error: observable error (listDirectory)");
                console.log(err);
            },
            complete() {
                console.log("complete: observable completed. this will only appear after directory created if there is no error.");
            }
        });
    }
    
}