import { Injectable } from '@angular/core';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
    providedIn: 'root',
})



export class ConfigService {
  disk: DiskInterface;
  constructor(private diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

    qRCodeUrl = false;

    // generateQRCode() {
    //     console.log("generateQRCode button pressed");
    // }

  }