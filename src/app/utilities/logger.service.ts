import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../models/disk/disk.interface';

import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';

@Injectable({
    providedIn: 'root',
})

export class Logger {
    disk: DiskInterface;
    diskSubscription: Subscription | undefined;

    constructor(
        private readonly diskModel: DiskModel,
        private readonly sqLite: SqLite
    ) { 
        this.disk = this.diskModel.getDisk(); 
        this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
            this.disk = updatedDisk;
        })    
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
        if (!this.disk.disableLogs && this.disk.numLogRows<=this.disk.maxLogRows) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}]: ${msg}`; 
            console.log(prefix + msg);
            this.sqLite.deleteOlderLogsIfThereAreTooMany();
            this.sqLite.store('logs', logMessage);
        }}
    
}