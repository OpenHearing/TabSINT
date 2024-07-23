import { Injectable } from '@angular/core';

import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
    providedIn: 'root',
})

export class Logger {
    disk: DiskInterface;

    constructor(
        public diskModel:DiskModel,
        public sqLite: SqLite
    ) { 
        this.disk = this.diskModel.getDisk(); 
    }

    debug(msg:string) {
        this.log(msg, "Debug: ");
    }
    
    warning(msg:string) {
        this.log(msg, "WARNING: ");
    }
    
    error(msg:string) {
        this.log(msg, "ERROR: ");
    }

    log(msg:string, prefix:string){
        if (!this.disk.disableLogs) {
            console.log(prefix + msg);
            this.sqLite.deleteOlderLogsIfThereAreTooMany();
            this.sqLite.store('logs', msg);
        }}
    
}