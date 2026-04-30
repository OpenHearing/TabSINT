import { Component, Input, inject } from '@angular/core';
import { DeviceState } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
})
export class DeviceCardComponent {
  @Input() device!: IDevice;
  @Input() bluetoothConnected = false;

  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);

  DeviceState = DeviceState;
  settingsExpanded = false;

  async reconnect(): Promise<void> {
    this.logger.debug('reconnecting to device: ' + this.device.deviceId);
    await this.devicesService.connect(this.device);
    await this.devicesService.checkForFirmwareUpdate(this.device);
  }

  async disconnect(): Promise<void> {
    this.logger.debug('disconnecting from device: ' + this.device.deviceId);
    await this.devicesService.disconnect(this.device);
  }

  async remove(): Promise<void> {
    this.logger.debug('removing device: ' + this.device.deviceId);
    if (this.device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(this.device);
    }
    await this.devicesService.removeSavedDevice(this.device);
  }

  toggleSettings(): void {
    this.settingsExpanded = !this.settingsExpanded;
  }
}
