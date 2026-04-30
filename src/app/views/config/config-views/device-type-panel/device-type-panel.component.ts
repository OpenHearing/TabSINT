import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { map, Observable, Subscription } from 'rxjs';

import { BluetoothType, DeviceState, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { FirmwareAsset } from '../../../../interfaces/firmware-asset.interface';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DevicesService } from '../../../../services/devices/devices.service';
import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';

@Component({
  selector: 'app-device-type-panel',
  templateUrl: './device-type-panel.component.html',
})
export class DeviceTypePanelComponent implements OnInit, OnDestroy {
  @Input() deviceType!: DeviceType;

  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);

  DeviceType = DeviceType;
  DeviceState = DeviceState;
  BluetoothType = BluetoothType;

  devices$!: Observable<IDevice[]>;
  disk: DiskInterface;
  state: StateInterface;

  maxDevices = 3;
  scanning = false;
  advancedExpanded = false;
  wahtsFirmwareAsset!: Promise<FirmwareAsset | undefined>;

  private stateSubscription: Subscription | undefined;
  private diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.devices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === this.deviceType && d.state !== DeviceState.Discovery))
    );

    if (this.deviceType === DeviceType.Wahts) {
      this.wahtsFirmwareAsset = this.devicesService.getApplicationFirmware(DeviceType.Wahts);
    }

    this.diskSubscription = this.diskModel.diskSubject.subscribe(updated => {
      this.disk = updated;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updated => {
      this.state = updated;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
    this.diskSubscription?.unsubscribe();
  }

  async addNewConnection(): Promise<void> {
    this.scanning = true;
    try {
      await this.devicesService.startDeviceSearch(this.deviceType);
      await this.devicesService.deviceConnectionDialog(this.deviceType);
    } finally {
      await this.devicesService.stopDeviceSearch(this.deviceType);
      this.scanning = false;
    }
  }

  async cancelNewConnection(): Promise<void> {
    await this.devicesService.stopDeviceSearch(this.deviceType);
    this.scanning = false;
  }

  toggleIgnoreFirmwareUpdates(): void {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    await this.devicesService.changeWahtsConnectionType(connectionType);
  }
}
