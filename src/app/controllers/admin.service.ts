import { Injectable } from '@angular/core';

import { Logger } from '../utilities/logger.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';

@Injectable({
    providedIn: 'root',
})

export class AdminService {
    disk: DiskInterface;

    constructor(public logger: Logger, public diskModel: DiskModel) {
        this.disk = this.diskModel.getDisk();
    }

    toggleDebugMode(value:boolean) {
        this.disk.debugMode = !value;
        this.logger.debug("Admin mode set to: "+this.disk.debugMode);
    }
    
}