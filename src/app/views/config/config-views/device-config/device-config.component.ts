import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { AppState, BluetoothType, DeviceState, DeviceType } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { Subscription } from 'rxjs/internal/Subscription';
import { DiskModel } from '../../../../models/disk/disk.service';
import { firstValueFrom } from 'rxjs';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { IWahtsDevice } from '../../../../interfaces/devices/wahts-device.interface';
import { FirmwareAsset } from '../../../../interfaces/firmware-asset.interface';

@Component({
  selector: 'app-device-config-view',
  templateUrl: './device-config.component.html',
  styleUrl: './device-config.component.css',
})
export class DeviceConfigComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);
  private readonly transloco = inject(TranslocoService);
  private readonly diskModel = inject(DiskModel);
  private readonly devicesService = inject(DevicesService);

  state: StateInterface;
  stateSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;
  disk: DiskInterface;
  BluetoothType = BluetoothType;
  wahtsFirmwareAsset = this.getWahtsFirmwareAsset();

  constructor() {
    this.state = this.stateModel.getState();
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
    this.diskSubscription?.unsubscribe();
  }

  /**
   * Toggle the preference for whether needed firmware updates show alerts.
   */
  toggleIgnoreFirmwareUpdates() {
    this.diskModel.updatePreferences({ ignoreFirmwareUpdates: !this.disk.preferences.ignoreFirmwareUpdates });
  }

  /**
   * Get the firmware asset for WAHTS devices.
   * @returns The firmware asset or undefined.
   */
  async getWahtsFirmwareAsset(): Promise<FirmwareAsset | undefined> {
    return this.devicesService.getApplicationFirmware(DeviceType.Wahts);
  }

  /**
   * Change the connection type used for WAHTS devices.
   * This will drop any existing WAHTS devices which do not match the specified type.
   *
   * @param connectionType The connection type to use for WAHTS devices.
   */
  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    const devices = await firstValueFrom(this.devicesService.devices);
    const removableDevices = devices.filter(device => device.type === DeviceType.Wahts && (device as IWahtsDevice).connectionType !== connectionType);
    for (const device of removableDevices) {
      if (device.state !== DeviceState.Disconnected) {
        await this.devicesService.disconnect(device);
      }
      await this.devicesService.removeSavedDevice(device);
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }

  get wahtsCommunicationPopover() { return this.transloco.translate('Set the connection type for WAHTS devices.'); }
  get wahtsFirmwarePopover() {
    return this.transloco.translate(`
    This version of the WAHTS Firmware is built into TabSINT and can be updated to the WAHTS wirelessly.
    TabSINT will work best if the WAHTS is updated to this version of the firmware.
  `);
  }
  get ignoreFirmwareUpdatesPopover() {
    return this.transloco.translate(`
    This option will ignore firmware update messages when connecting to a device.
    Each version of TabSINT supports a specific versions of device firmware.
    If this option is not checked, TabSINT will pop a notification if the current version of a device's firmware is not supported by TabSINT.
  `);
  }
}
