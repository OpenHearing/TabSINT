import { Component } from '@angular/core';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceState, DeviceType } from '../../../../utilities/constants';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'new-connection',
  templateUrl: './new-connection.component.html',
})
export class NewConnectionComponent {
  deviceTypes = Object.values(DeviceType);
  connectedDevices: Observable<IDevice[]>;
  maxConnectedDevices = 2;
  newDeviceConnection: boolean;
  newConnectionType: DeviceType | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor(private readonly devicesService: DevicesService) {
    this.newDeviceConnection = false;
    this.connectedDevices = this.devicesService.devices.pipe(
      map(devices => devices.filter((device: IDevice) => device.state !== DeviceState.Discovery))
    );
  }

  changeDeviceType(type: DeviceType) {
    this.newConnectionType = type;
  }

  addNewConnection(): void {
    this.newDeviceConnection = true;
  }

  async scanAndConnect() {
    if (this.newConnectionType) {
      await this.devicesService.startDeviceSearch(this.newConnectionType);
      await this.devicesService.deviceConnectionDialog(this.newConnectionType);
      await this.devicesService.stopDeviceSearch(this.newConnectionType);
      this.newDeviceConnection = false;
      this.newConnectionType = undefined;
    }
  }

  cancel() {
    this.newDeviceConnection = false;
    this.newConnectionType = undefined;
  }
}
