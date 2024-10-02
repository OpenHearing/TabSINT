import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { NgFor, NgClass } from '@angular/common';
import { BleDevice } from '../../../../interfaces/bluetooth.interface';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'device-choose-view',
  standalone: true,
  templateUrl: './device-choose.component.html',
  imports: [FormsModule,TranslateModule,  NgFor, NgClass]
})
export class DeviceChooseComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  availableDevices: Array<BleDevice>;
  selectedDevice: BleDevice | undefined;
  subscription: Subscription | undefined;

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
    this.subscription = this.devicesModel.availableDevicesSubject.subscribe( (availableDevices:BleDevice[]) => {
      this.availableDevices = availableDevices;
      this.changeDetection.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
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
