import { Injectable } from '@angular/core';
import { Filesystem } from '@capacitor/filesystem';

import { DiskM } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';

@Injectable({
    providedIn: 'root',
})

export class Logger {

    constructor(public diskM:DiskM) {  }

    debug(msg:string) {
        if (!this.diskM.diskM.disableLogs) {
            console.log("Debug: "+ msg);
        }
    }
    
    warning(msg:string) {
        if (!this.diskM.diskM.disableLogs) {
            console.log("WARNING: "+ msg);
        }
    }
    
    error(msg:string) {
        if (!this.diskM.diskM.disableLogs) {
            console.log("ERROR: "+ msg);
        }
    }
    
}