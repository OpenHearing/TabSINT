import { Injectable } from '@angular/core';
import { Filesystem } from '@capacitor/filesystem';

import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
    providedIn: 'root',
})

export class Logger {
    disk: DiskInterface;

    constructor(public diskModel:DiskModel) { 
        this.disk = this.diskModel.getDisk(); }

    debug(msg:string) {
        if (!this.disk.disableLogs) {
            console.log("Debug: "+ msg);
        }
    }
    
    warning(msg:string) {
        if (!this.disk.disableLogs) {
            console.log("WARNING: "+ msg);
        }
    }
    
    error(msg:string) {
        if (!this.disk.disableLogs) {
            console.log("ERROR: "+ msg);
        }
    }
    
}