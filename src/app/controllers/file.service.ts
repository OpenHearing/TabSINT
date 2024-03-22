import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding, ReadFileResult, CopyResult } from '@capacitor/filesystem';
import { Logger } from '../utilities/logger.service';

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
        } else {
            this.logger.debug("Invalid dirLoc in directoryHandler, defaulting to Documents");
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

    async writeFile(filepath:string, data:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        this.logger.debug("Writing to: "+filepath);
        return Filesystem.writeFile({
            path: filepath,
            data: data,
            directory: directory,
            encoding: Encoding.UTF8,
        }).then( (res)=> {
            this.logger.debug("Wrote to: "+filepath);
            return res
        }).catch( (err)=> {
            this.logger.error("Error writing to "+filepath+" - "+err);
        });
    };
      
    async readFile(filepath:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        this.logger.debug("Reading from: "+filepath);
        return Filesystem.readFile({
            path: filepath,
            directory: directory,
            encoding: Encoding.UTF8,
        }).then( (res)=> {
            this.logger.debug("Read file: "+filepath);
            return res
        }).catch( (err)=> {
            this.logger.error("Error reading "+filepath+" - "+err);
        });
    };

    async createDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        this.logger.debug("Creating dir: "+dir);
        return Filesystem.mkdir({
            path: dir,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Created dir: "+dir);
        }).catch( (err)=> {
            this.logger.error("Error creating dir "+dir+" - "+err);
        });
    }

    async deleteDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        this.logger.debug("Deleting dir: "+dir);
        return Filesystem.rmdir({
            path: dir,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Deleted dir: "+dir);
            return res
        }).catch( (err)=> {
            this.logger.error("Error deleting dir "+dir+" - "+err);
        });
    }

    async listDirectory(dir:string, dirLoc?:string) {
        let directory = this.directoryHandler(dirLoc);
        this.logger.debug("Listing dir: "+dir);
        return Filesystem.readdir({
            path: dir,
            directory: directory,
        }).then( (res)=> {
            this.logger.debug("Listed dir: "+dir);
            console.log(res);
            return res
        }).catch( (err)=> {
            this.logger.error("Error listing dir "+dir+" - "+err);
        });
    }

    async copyDirectory(_from: string, _to: string): Promise<CopyResult | void> {
        let _fromDir = this.directoryHandler(_from);
        let _toDir = this.directoryHandler(_to);
        this.logger.debug("Copying directory from: " + _fromDir + " to: " + _toDir);
        return Filesystem.copy({
            from: _fromDir,
            to: _toDir,
        }).then( (res)=> {
            this.logger.debug("Copied dir from: " + _fromDir + " to: " + _toDir);
            return res
        }).catch( (err)=> {
            this.logger.error("Error copying dir from: " + _fromDir + " to: " + _toDir);
        });
    }
    
}