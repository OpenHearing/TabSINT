import { Injectable } from '@angular/core';

import { Logger } from '../utilities/logger.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';


@Injectable({
    providedIn: 'root',
})

export class AdminService {
    disk: DiskInterface;

    constructor(
        public diskModel: DiskModel, 
        public logger: Logger
    ) {
        this.disk = this.diskModel.getDisk();
    }

    toggleDebugMode() {
        this.diskModel.updateDiskModel('debugMode',!this.diskModel.disk.debugMode)
        this.disk = this.diskModel.getDisk()
    }

    toggleDisableLogs() {
        this.diskModel.updateDiskModel('disableLogs', !this.disk.disableLogs);
        this.disk = this.diskModel.getDisk()
        console.log("toggleDisableLogs: ", this.disk.disableLogs);
    }

    // toggleDisableVolume() {
    //     console.log("toggleDisableVolume");
    // }

    // toggleAdminSkipMode() {
    //     console.log("toggleAdminSkipMode");
    // }

    // toggleRequireEncryptedResults() {
    //     console.log("toggleRequireEncryptedResults");
    // }

    // toggleRecordTestLocation() {
    //     console.log("toggleRecordTestLocation");
    // }

}