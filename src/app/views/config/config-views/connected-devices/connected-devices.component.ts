import { Component } from '@angular/core';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { TympanState } from '../../../../utilities/constants';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ConnectedDevice } from '../../../../interfaces/new-device.interface';
import { TympanService } from '../../../../controllers/tympan.service';
import { Logger } from '../../../../utilities/logger.service';
import { isTympanDevice } from '../../../../guards/type.guard';
import { DeviceUtil } from '../../../../utilities/device-utility';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html',
  imports: [TranslateModule]
})
export class ConnectedDevicesComponent {
  devices: DevicesInterface;
  state: StateInterface
  TympanState = TympanState;

  expanded:boolean = false;
  
  constructor(
    private deviceModel: DevicesModel, 
    private stateModel: StateModel, 
    private tympanService: TympanService,
    private logger: Logger,
    private deviceUtil: DeviceUtil
  ) { 
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
  }

  reconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to reconnect to device: "+JSON.stringify(device));
    if (isTympanDevice(device)) {
      this.tympanService.reconnect(device.deviceId);
    }
  }

  disconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to disconnect from device:"+JSON.stringify(device));
    if (isTympanDevice(device)) {
      this.tympanService.disconnect(device.deviceId);
      this.deviceUtil.updateDeviceState(device.deviceId,TympanState.Disconnected);
    }
  }

  remove(device:ConnectedDevice) {
    this.logger.debug("remove() button pressed, attempting to disconnect and remove: "+JSON.stringify(device));
    this.disconnect(device);
    let indexToRemove: number = -1;
    if (isTympanDevice(device)) {
      for (let i = 0; i < this.devices.connectedDevices.tympan.length; i++) {
        if (this.devices.connectedDevices.tympan[i].deviceId==device.deviceId) {
          indexToRemove = i;
        }
      }
      if (indexToRemove!=-1) {
        this.devices.connectedDevices.tympan.splice(indexToRemove, 1);
      }
    }
  }

}
