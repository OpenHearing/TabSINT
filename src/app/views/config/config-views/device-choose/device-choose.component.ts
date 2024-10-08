import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { BleDevice } from '../../../../interfaces/bluetooth.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { DevicesModel } from '../../../../models/devices/devices-model.service';

@Component({
  selector: 'device-choose-view',
  standalone: true,
  templateUrl: './device-choose.component.html',
  imports: [FormsModule,TranslateModule,  NgFor, NgClass]
})
export class DeviceChooseComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  diskSubject: Subscription | undefined;
  availableDevices: Array<BleDevice>;
  selectedDevice: BleDevice | undefined;
  devicesSubject: Subscription | undefined;

  constructor(
    private readonly changeDetection: ChangeDetectorRef,
    private readonly dialogRef: MatDialogRef<DeviceChooseComponent>,
    private readonly diskModel: DiskModel, 
    private readonly devicesModel: DevicesModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.availableDevices = [];
  }

  ngOnInit() {
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    

    this.devicesSubject = this.devicesModel.availableDevicesSubject.subscribe( (availableDevices:BleDevice[]) => {
      this.availableDevices = availableDevices;
      this.changeDetection.detectChanges();
    });
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
    this.devicesSubject?.unsubscribe();
  }

  choose(device:BleDevice) {
    this.selectedDevice = device;
    this.changeDetection.detectChanges();
  }

  select() {
    this.dialogRef.close(this.selectedDevice);
  }

  cancel() {
    this.dialogRef.close();
  }

}
