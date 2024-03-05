import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Logger } from '../utilities/logger.service';

@Injectable({
    providedIn: 'root',
})

export class FileService {

    constructor(public logger:Logger) {  }

    async checkPermissions() {
        let p = await Filesystem.checkPermissions()
        this.logger.debug("Checking file permissions: "+JSON.stringify(p));
    }
    
    async requestPermissions() {
        let p = await Filesystem.requestPermissions()
        this.logger.debug("Requesting file permissions: "+JSON.stringify(p));
    }

    async writeFile(filepath:string, data:string) {
        await Filesystem.writeFile({
          path: filepath,
          data: data,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        this.logger.debug('Wrote data to '+JSON.stringify(filepath));
    };
      
    async readFile(filepath:string) {
        const contents = await Filesystem.readFile({
          path: filepath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        this.logger.debug('Reading '+JSON.stringify(filepath)+', file contents: '+JSON.stringify(contents));
    };
    
    async createDirectory(dir:string) {
        await Filesystem.mkdir({
            path: dir,
            directory: Directory.Documents,
        });
        this.logger.debug('Created directory: '+JSON.stringify(dir));
    }

    async deleteDirectory(dir:string) {
        await Filesystem.rmdir({
            path: dir,
            directory: Directory.Documents,
        });
        this.logger.debug('Deleted directory: '+JSON.stringify(dir));
    }

    async listDirectory(dir:string) {
        const files = await Filesystem.readdir({
            path: dir,
            directory: Directory.Documents,
        });
        this.logger.debug('List of files in dir: '+JSON.stringify(files));
    }
    
}