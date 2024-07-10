import { Injectable } from '@angular/core';
import { Filesystem } from '@capacitor/filesystem';

import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { getDateString } from './results-helper-functions';
import { DevicesModel } from '../models/devices/devices.service';
import { DevicesInterface } from '../models/devices/devices.interface';

@Injectable({
    providedIn: 'root',
})

export class Logger {
    disk: DiskInterface;
    devices: DevicesInterface;

    constructor(
        public diskModel:DiskModel,
        public devicesModel: DevicesModel,
        public sqLite: SqLite
    ) { 
        this.disk = this.diskModel.getDisk(); 
        this.devices = this.devicesModel.getDevices();
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