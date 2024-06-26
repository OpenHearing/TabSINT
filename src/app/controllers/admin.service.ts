import { Injectable } from '@angular/core';

import { Logger } from '../utilities/logger.service';
import { DiskInterface } from '../models/disk/disk.interface';
import { DiskModel } from '../models/disk/disk.service';

@Injectable({
    providedIn: 'root',
})

export class AdminService {
    disk: DiskInterface;

    keyboardStyle = { "padding-top": "0px" };

    constructor(
        public diskModel: DiskModel, 
        public logger: Logger
    ) {
        this.disk = this.diskModel.getDisk();
    }

    keyboardSpace = (height:any)=> {
        setTimeout( ()=> {
          this.keyboardStyle = { "padding-top": height + "px" };
        }, 0);
    };

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