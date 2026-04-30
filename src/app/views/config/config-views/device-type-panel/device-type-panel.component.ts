import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { map, Observable, Subscription, firstValueFrom } from 'rxjs';

import { BluetoothType, DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { IWahtsDevice } from '../../../../interfaces/devices/wahts-device.interface';
import { FirmwareAsset } from '../../../../interfaces/firmware-asset.interface';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';

import { DevicesService } from '../../../../services/devices/devices.service';
import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';
import { Logger } from '../../../../services/logger.service';
import { Notifications } from '../../../../services/notifications.service';

@Component({
  selector: 'app-device-type-panel',
  templateUrl: './device-type-panel.component.html',
})
export class DeviceTypePanelComponent implements OnInit, OnDestroy {
  @Input() deviceType!: DeviceType;

  private readonly devicesService = inject(DevicesService);
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);

  DeviceType = DeviceType;
  DeviceState = DeviceState;
  BluetoothType = BluetoothType;

  devices$!: Observable<IDevice[]>;
  disk: DiskInterface;
  state: StateInterface;

  maxDevices = 3;
  scanning = false;
  settingsExpanded = new Map<string, boolean>();
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
      map(devices =>
        devices.filter(d => d.type === this.deviceType && d.state !== DeviceState.Discovery)
      )
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

  async reconnect(device: IDevice): Promise<void> {
    this.logger.debug('reconnecting to device: ' + device.deviceId);
    await this.devicesService.connect(device);
    await this.checkForFirmwareUpdate(device);
  }

  async disconnect(device: IDevice): Promise<void> {
    this.logger.debug('disconnecting from device: ' + device.deviceId);
    await this.devicesService.disconnect(device);
  }

  async remove(device: IDevice): Promise<void> {
    this.logger.debug('removing device: ' + device.deviceId);
    if (device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(device);
    }
    await this.devicesService.removeSavedDevice(device);
  }

  toggleSettings(device: IDevice): void {
    const current = this.settingsExpanded.get(device.deviceId) ?? false;
    this.settingsExpanded.set(device.deviceId, !current);
  }

  async checkForFirmwareUpdate(device: IDevice): Promise<void> {
    const firmwareAsset = await this.devicesService.getApplicationFirmware(device.type);
    if (
      !this.disk.preferences.ignoreFirmwareUpdates &&
      device.metadata.buildDateTime &&
      firmwareAsset?.buildDatetime &&
      Date.parse(device.metadata.buildDateTime) !== Date.parse(firmwareAsset.buildDatetime)
    ) {
      const msg: DialogDataInterface = {
        title: 'Firmware Update',
        content: `
          The firmware on device ${device.deviceId} is not supported by this TabSINT version.
          This TabSINT version supports ${firmwareAsset.version} firmware.
          Select 'OK' to update the firmware on ${device.deviceId}.
          The firmware can also be updated through the device information panel.
        `,
        type: DialogType.Confirm,
      };
      this.notifications.alert(msg).subscribe(async result => {
        if (result === 'OK') {
          await this.devicesService.reprogramFirmwareDialog(device);
        }
      });
    }
  }

  toggleIgnoreFirmwareUpdates(): void {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    const devices = await firstValueFrom(this.devicesService.devices);
    const toRemove = devices.filter(
      d => d.type === DeviceType.Wahts && (d as IWahtsDevice).connectionType !== connectionType
    );
    for (const device of toRemove) {
      if (device.state !== DeviceState.Disconnected) {
        await this.devicesService.disconnect(device);
      }
      await this.devicesService.removeSavedDevice(device);
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }
}
