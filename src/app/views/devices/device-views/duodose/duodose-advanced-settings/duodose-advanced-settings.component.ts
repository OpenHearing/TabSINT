import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { BluetoothType, DeviceType } from '../../../../../utilities/constants';
import { FirmwareAsset } from '../../../../../interfaces/firmware-asset.interface';
import { DiskInterface } from '../../../../../models/disk/disk.interface';

import { DevicesService } from '../../../../../services/devices/devices.service';
import { DiskModel } from '../../../../../models/disk/disk.service';

@Component({
  selector: 'app-duodose-advanced-settings',
  templateUrl: './duodose-advanced-settings.component.html',
})
export class DuodoseAdvancedSettingsComponent implements OnInit, OnDestroy {
  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);

  BluetoothType = BluetoothType;
  disk: DiskInterface;
  advancedExpanded = false;
  wahtsFirmwareAsset!: Promise<FirmwareAsset | undefined>;

  private diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.wahtsFirmwareAsset = this.devicesService.getApplicationFirmware(DeviceType.Wahts);

    this.diskSubscription = this.diskModel.diskSubject.subscribe(updated => {
      this.disk = updated;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  toggleIgnoreFirmwareUpdates(): void {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    await this.devicesService.changeWahtsConnectionType(connectionType);
  }
}
