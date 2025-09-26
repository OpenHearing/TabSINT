import { Component, OnDestroy, OnInit } from '@angular/core';
import { AvailableConnectableDevices } from '../../../../utilities/constants';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { NewConnectedDevice } from '../../../../interfaces/connected-device.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { DevicesService } from '../../../../controllers/devices.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'new-connection',
  templateUrl: './new-connection.component.html'
})

export class NewConnectionComponent implements OnInit, OnDestroy {
  state: StateInterface
  devices: DevicesInterface;
  newConnectedDevice: NewConnectedDevice;
  deviceTypes = AvailableConnectableDevices;
  maxConnectedDevices: number = 1;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly deviceModel: DevicesModel, 
    private readonly devicesService: DevicesService, 
    private readonly stateModel: StateModel
  ) {
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
    this.newConnectedDevice = {"type":"Select One"};
  }

  ngOnInit(){
    this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
      this.state = updatedState;
    });
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  changeDeviceType(type:string) {
    this.newConnectedDevice.type = type;
  }

  addNewConnection(): void {
    this.stateModel.updateState({newDeviceConnection: true});
  }

  async scanAndConnect() {
    await this.devicesService.scan(this.newConnectedDevice);
    this.stateModel.updateState({newDeviceConnection: false});
    this.newConnectedDevice = {"type":"Select One"};
  }

  cancel() {
    this.stateModel.updateState({newDeviceConnection: false});
    this.newConnectedDevice = {"type":"Select One"};
  }

}
