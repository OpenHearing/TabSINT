import { Component } from '@angular/core';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { TympanState } from '../../../../utilities/constants';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ConnectedDevice } from '../../../../interfaces/new-device.interface';
import { TympanService } from '../../../../controllers/tympan.service';
import { Logger } from '../../../../utilities/logger.service';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html',
  styleUrl: './connected-devices.component.css'
})
export class ConnectedDevicesComponent {
  devices: DevicesInterface;
  state: StateInterface
  TympanState = TympanState;

  expanded:boolean = false;
  
  constructor(
    public deviceModel: DevicesModel, 
    public stateModel: StateModel, 
    public tympanService: TympanService,
    public logger: Logger
  ) { 
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
  }

  reconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to reconnect to device: "+JSON.stringify(device));
    if (device.type=="Tympan") {
      this.tympanService.reconnect(device.id);
    }
  }

  disconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to disconnect from device:"+JSON.stringify(device));
    if (device.type=="Tympan") {
      this.tympanService.disconnect(device.id);
      for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
        if (this.devices.connectedDevices.tympan[i].id==device.id) {
          this.devices.connectedDevices.tympan[i].state = TympanState.Disconnected;
        }
      }
    }
  }

  remove(device:ConnectedDevice) {
    this.logger.debug("remove() button pressed, attempting to disconnect and remove: "+JSON.stringify(device));
    this.disconnect(device);
    var indexToRemove: number = -1;
    if (device.type=="Tympan") {
      for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
        if (this.devices.connectedDevices.tympan[i].id==device.id) {
          indexToRemove = i;
        }
      }
      if (indexToRemove!=-1) {
        this.devices.connectedDevices.tympan.splice(indexToRemove, 1);
      }
    }
  }

}
