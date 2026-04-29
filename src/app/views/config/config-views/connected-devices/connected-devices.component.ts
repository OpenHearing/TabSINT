import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { BluetoothType, DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs/internal/Subscription';
import { firstValueFrom, map, Observable } from 'rxjs';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DiskModel } from '../../../../models/disk/disk.service';
import { Notifications } from '../../../../services/notifications.service';
import { DialogDataInterface } from '../../../../interfaces/dialog-data.interface';
import { IWahtsDevice } from '../../../../interfaces/devices/wahts-device.interface';
import { FirmwareAsset } from '../../../../interfaces/firmware-asset.interface';

@Component({
  selector: 'app-connected-devices',
  templateUrl: './connected-devices.component.html',
})
export class ConnectedDevicesComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);
  private readonly transloco = inject(TranslocoService);
  private readonly diskModel = inject(DiskModel);
  private readonly notifications = inject(Notifications);

  DeviceType = DeviceType;
  BluetoothType = BluetoothType;
  disk: DiskInterface;
  connectedDevicesMap: Observable<Map<DeviceType, IDevice[]>>;
  state: StateInterface;
  DeviceState = DeviceState;
  settingsExpanded = new Map<string, boolean>();
  advancedExpanded = new Map<DeviceType, boolean>();
  wahtsFirmwareAsset = this.getWahtsFirmwareAsset();

  stateSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.state = this.stateModel.getState();
    this.connectedDevicesMap = this.devicesService.devices.pipe(
      map(devices => {
        const devicesMap = new Map<DeviceType, IDevice[]>();
        devices.forEach(device => {
          if (device.state !== DeviceState.Discovery) {
            if (devicesMap.has(device.type)) {
              devicesMap.get(device.type)?.push(device);
            } else {
              devicesMap.set(device.type, [device]);
            }
          }
        });
        return devicesMap;
      })
    );
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
    this.diskSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  async reconnect(device: IDevice) {
    this.logger.debug('attempting to reconnect to device: ' + JSON.stringify(device));
    await this.devicesService.connect(device);
    await this.checkForFirmwareUpdate(device);
  }

  async disconnect(device: IDevice) {
    this.logger.debug('attempting to disconnect from device:' + JSON.stringify(device));
    await this.devicesService.disconnect(device);
  }

  async remove(device: IDevice) {
    this.logger.debug('attempting to disconnect and remove: ' + JSON.stringify(device));
    if (device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(device);
    }
    await this.devicesService.removeSavedDevice(device);
  }

  async checkForFirmwareUpdate(device: IDevice) {
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
        The firmware can be also updated through the device information panel.
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

  getPanelState(deviceType: DeviceType): boolean {
    let panel = false;
    switch (deviceType) {
      case DeviceType.Tympan:
        panel = this.state.isPaneOpen.tympans;
        break;
      case DeviceType.Wahts:
        panel = this.state.isPaneOpen.wahts;
        break;
      case DeviceType.Duodose:
        panel = this.state.isPaneOpen.duodose;
        break;
      default:
        deviceType satisfies never;
        break;
    }
    return panel;
  }

  setPanelState(deviceType: DeviceType, state: boolean) {
    switch (deviceType) {
      case DeviceType.Tympan:
        this.stateModel.updatePaneOpen({ tympans: state });
        break;
      case DeviceType.Wahts:
        this.stateModel.updatePaneOpen({ wahts: state });
        break;
      case DeviceType.Duodose:
        this.stateModel.updatePaneOpen({ duodose: state });
        break;
      default:
        deviceType satisfies never;
        break;
    }
  }

  toggleSettingsExpanded(device: IDevice) {
    const current = this.settingsExpanded.get(device.deviceId) ?? false;
    this.settingsExpanded.set(device.deviceId, !current);
  }

  toggleAdvancedExpanded(deviceType: DeviceType) {
    const current = this.advancedExpanded.get(deviceType) ?? false;
    this.advancedExpanded.set(deviceType, !current);
  }

  shouldShowDevicePanel(deviceType: DeviceType): boolean {
    switch (deviceType) {
      case DeviceType.Tympan:
        return this.disk.preferences.showTympanPanel ?? true;
      case DeviceType.Wahts:
        return this.disk.preferences.showWahtsPanel ?? true;
      case DeviceType.Duodose:
        return this.disk.preferences.showDuodosePanel ?? true;
      default:
        deviceType satisfies never;
        return true;
    }
  }

  toggleIgnoreFirmwareUpdates() {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  async getWahtsFirmwareAsset(): Promise<FirmwareAsset | undefined> {
    return this.devicesService.getApplicationFirmware(DeviceType.Wahts);
  }

  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    const devices = await firstValueFrom(this.devicesService.devices);
    const removableDevices = devices.filter(
      device => device.type === DeviceType.Wahts && (device as IWahtsDevice).connectionType !== connectionType
    );
    for (const device of removableDevices) {
      if (device.state !== DeviceState.Disconnected) {
        await this.devicesService.disconnect(device);
      }
      await this.devicesService.removeSavedDevice(device);
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }
}
