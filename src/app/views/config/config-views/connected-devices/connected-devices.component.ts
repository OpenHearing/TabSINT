import { Component } from '@angular/core';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { DeviceState } from '../../../../utilities/constants';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ConnectedDevice } from '../../../../interfaces/connected-device.interface';
import { DevicesService } from '../../../../controllers/devices.service';
import { Logger } from '../../../../utilities/logger.service';
import { DeviceUtil } from '../../../../utilities/device-utility';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html'
})
export class ConnectedDevicesComponent {
  devices: DevicesInterface;
  state: StateInterface
  DeviceState = DeviceState;
  // TODO: move 'expanded' variable below generalizable to state model and extend to multiple devices
  expanded:boolean = false;
  
  constructor(
    private readonly deviceModel: DevicesModel, 
    private readonly stateModel: StateModel, 
    private readonly devicesService: DevicesService,
    private readonly logger: Logger,
    private readonly deviceUtil: DeviceUtil,
    private readonly translate: TranslateService
  ) { 
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
  }

  reconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to reconnect to device: "+JSON.stringify(device));
    this.devicesService.reconnect(device);
  }

  disconnect(device:ConnectedDevice) {
    this.logger.debug("attempting to disconnect from device:"+JSON.stringify(device));
    this.devicesService.disconnect(device);
  }

  remove(device:ConnectedDevice) {
    this.logger.debug("remove() button pressed, attempting to disconnect and remove: "+JSON.stringify(device));
    this.devicesService.removeDevice(device);
  }

}
