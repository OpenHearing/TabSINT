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
        private diskModel: DiskModel, 
        private logger: Logger
    ) {
        this.disk = this.diskModel.getDisk();
    }
}