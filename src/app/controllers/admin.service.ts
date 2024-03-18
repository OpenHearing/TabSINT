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

    toggleDebugMode() {
        console.log("toggleDebugMode");
    }

    toggleDisableLogs() {
        console.log("toggleDisableLogs");
    }

    toggleDisableVolume() {
        console.log("toggleDisableVolume");
    }

    toggleAdminSkipMode() {
        console.log("toggleAdminSkipMode");
    }

    toggleRequireEncryptedResults() {
        console.log("toggleRequireEncryptedResults");
    }

    toggleRecordTestLocation() {
        console.log("toggleRecordTestLocation");
    }

    toggleAppDeveloperMode() {
        console.log("toggleAppDeveloperMode");
    }
    
}