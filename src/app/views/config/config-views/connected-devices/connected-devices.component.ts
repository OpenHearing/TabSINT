import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html'
})
export class ConnectedDevicesComponent implements OnInit, OnDestroy {
  devices: DevicesInterface;
  state: StateInterface;
  DeviceState = DeviceState;
  expanded: boolean = false;

  // Subscriptions
  stateSubscription: Subscription | undefined;

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

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState) => {
      this.state = updatedState;
    });
  };

  reconnect(device: ConnectedDevice) {
    this.logger.debug("attempting to reconnect to device: " + JSON.stringify(device));
    this.devicesService.reconnect(device);
  }

  disconnect(device: ConnectedDevice) {
    this.logger.debug("attempting to disconnect from device:" + JSON.stringify(device));
    this.devicesService.disconnect(device);
  }

  remove(device: ConnectedDevice) {
    this.logger.debug("remove() button pressed, attempting to disconnect and remove: " + JSON.stringify(device));
    this.deviceUtil.removeSavedDevice(device);
    this.devicesService.removeDevice(device);
  }

}
