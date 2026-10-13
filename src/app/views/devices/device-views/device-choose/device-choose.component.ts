import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass, CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { map, Observable, Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceState, DeviceType } from '../../../../utilities/constants';

@Component({
  selector: 'app-device-choose-view',
  standalone: true,
  templateUrl: './device-choose.component.html',
  imports: [FormsModule, TranslocoPipe, NgFor, NgClass, CommonModule],
})
export class DeviceChooseComponent implements OnInit, OnDestroy {
  private readonly changeDetection = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<DeviceChooseComponent>);
  private readonly diskModel = inject(DiskModel);
  private readonly devicesService = inject(DevicesService);
  readonly deviceType = inject<DeviceType>(MAT_DIALOG_DATA);

  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  discoveredDevices: Observable<IDevice[]>;
  selectedDevice: IDevice | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.discoveredDevices = this.devicesService.devices.pipe(
      map(devices => devices.filter((device: IDevice) => device.type === this.deviceType && device.state == DeviceState.Discovery))
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
    this.dialogRef.close(this.selectedDevice);
  }
}
