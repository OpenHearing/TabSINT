import { Component } from '@angular/core';
import { AvailableConnectableDevices } from '../../../../utilities/constants';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { NewConnectedDevice } from '../../../../interfaces/connected-device.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { DevicesService } from '../../../../controllers/devices.service';

@Component({
  selector: 'new-connection',
  templateUrl: './new-connection.component.html'
})

export class NewConnectionComponent {
  state: StateInterface
  devices: DevicesInterface;
  newConnectedDevice: NewConnectedDevice;
  deviceTypes = AvailableConnectableDevices;
  maxConnectedDevices: number = 1; // TODO: Increase the number of allowed conections

  constructor(
    private readonly deviceModel: DevicesModel, 
    private readonly devicesService: DevicesService, 
    private readonly stateModel: StateModel
  ) {
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
    this.newConnectedDevice = {"type":"Select One"};
  }

  changeDeviceType(type:string) {
    this.newConnectedDevice.type = type;
  }

  addNewConnection(): void {
    this.state.newDeviceConnection = true;
  }

  async scanAndConnect() {
    await this.devicesService.scan(this.newConnectedDevice);
    this.state.newDeviceConnection = false;
    this.newConnectedDevice = {"type":"Select One"};
  }

  cancel() {
    this.state.newDeviceConnection = false;
    this.newConnectedDevice = {"type":"Select One"};
  }

}
