import { Component, inject } from '@angular/core';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { map, Observable } from 'rxjs';
import { Notifications } from '../../../../services/notifications.service';

@Component({
  selector: 'app-new-connection',
  templateUrl: './new-connection.component.html',
})
export class NewConnectionComponent {
  private readonly devicesService = inject(DevicesService);
  private readonly notifications = inject(Notifications);

  deviceTypes = Object.values(DeviceType);
  connectedDevices: Observable<IDevice[]>;
  maxConnectedDevices = 3;
  newDeviceConnection: boolean = false;
  newConnectionType: DeviceType | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor() {
    this.connectedDevices = this.devicesService.devices.pipe(
      map(devices => devices.filter((device: IDevice) => device.state !== DeviceState.Discovery))
    );
  }

  changeDeviceType(type: DeviceType) {
    this.newConnectionType = type;
  }

  async selectAndScan(type: DeviceType) {
    this.changeDeviceType(type);
    await this.scanAndConnect();
  }

  addNewConnection(): void {
    this.newDeviceConnection = true;
  }

  async scanAndConnect() {
    if (this.newConnectionType) {
      try {
        await this.devicesService.startDeviceSearch(this.newConnectionType);
        await this.devicesService.deviceConnectionDialog(this.newConnectionType);
      } catch {
        this.notifications
          .alert({
            title: 'Search Failed',
            content: 'Unable to start a device search.',
            type: DialogType.Alert,
          })
          .subscribe();
      } finally {
        try {
          await this.devicesService.stopDeviceSearch(this.newConnectionType);
        } finally {
          this.newDeviceConnection = false;
          this.newConnectionType = undefined;
        }
      }
    }
  }

  cancel() {
    this.newDeviceConnection = false;
    this.newConnectionType = undefined;
  }
}
