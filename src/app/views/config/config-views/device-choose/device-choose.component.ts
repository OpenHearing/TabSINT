import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass, CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceState, DeviceType } from '../../../../utilities/constants';

@Component({
  selector: 'device-choose-view',
  standalone: true,
  templateUrl: './device-choose.component.html',
  imports: [FormsModule, TranslateModule, NgFor, NgClass, CommonModule],
})
export class DeviceChooseComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  discoveredDevices: Observable<IDevice[]>;
  selectedDevice: IDevice | undefined;

  constructor(
    private readonly changeDetection: ChangeDetectorRef,
    private readonly dialogRef: MatDialogRef<DeviceChooseComponent>,
    private readonly diskModel: DiskModel,
    private readonly devicesService: DevicesService,
    @Inject(MAT_DIALOG_DATA) public deviceType: DeviceType
  ) {
    this.disk = this.diskModel.getDisk();
    this.discoveredDevices = this.devicesService.devices.pipe(
      map(devices => devices.filter((device: IDevice) => device.type === deviceType && device.state == DeviceState.Discovery))
    );
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  choose(device: IDevice) {
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
