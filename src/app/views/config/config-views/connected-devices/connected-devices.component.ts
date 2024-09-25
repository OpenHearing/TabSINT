import { Component } from '@angular/core';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { TympanState } from '../../../../utilities/constants';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html',
  styleUrl: './connected-devices.component.css'
})
export class ConnectedDevicesComponent {
  devices: DevicesInterface;
  TympanState = TympanState;
  
  constructor(public deviceModel: DevicesModel) { 
    this.devices = this.deviceModel.getDevices();
  }

}
