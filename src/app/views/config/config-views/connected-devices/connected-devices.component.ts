import { Component, OnDestroy, OnInit } from '@angular/core';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceState, DeviceType } from '../../../../utilities/constants';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'connected-devices',
  templateUrl: './connected-devices.component.html',
})
export class ConnectedDevicesComponent implements OnInit, OnDestroy {
  DeviceType = DeviceType;
  connectedDevicesMap: Observable<Map<DeviceType, IDevice[]>>;
  state: StateInterface;
  DeviceState = DeviceState;
  expanded = new Map<string, boolean>();

  // Subscriptions
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly stateModel: StateModel,
    private readonly devicesService: DevicesService,
    private readonly logger: Logger,
    private readonly translate: TranslateService
  ) {
    this.state = this.stateModel.getState();
    this.connectedDevicesMap = this.devicesService.devices.pipe(
      map(devices => {
        const devicesMap = new Map<DeviceType, IDevice[]>();
        devices.forEach(device => {
          if (device.state !== DeviceState.Discovery) {
            if (devicesMap.has(device.type)) {
              devicesMap.get(device.type)?.push(device);
            } else {
              devicesMap.set(device.type, [device]);
            }
          }
        });
        return devicesMap;
      })
    );
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  async reconnect(device: IDevice) {
    this.logger.debug('attempting to reconnect to device: ' + JSON.stringify(device));
    await this.devicesService.connect(device);
  }

  async disconnect(device: IDevice) {
    this.logger.debug('attempting to disconnect from device:' + JSON.stringify(device));
    await this.devicesService.disconnect(device);
  }

  async remove(device: IDevice) {
    this.logger.debug('attempting to disconnect and remove: ' + JSON.stringify(device));
    if (device.state !== DeviceState.Disconnected) {
      await this.devicesService.disconnect(device);
    }
    await this.devicesService.removeSavedDevice(device);
  }

  getPanelState(deviceType: DeviceType): boolean {
    let panel = false;
    switch (deviceType) {
      case DeviceType.Tympan:
        panel = this.state.isPaneOpen.tympans;
        break;
      case DeviceType.Wahts:
        panel = this.state.isPaneOpen.wahts;
        break;
      default:
        deviceType satisfies never;
        break;
    }
    return panel;
  }

  setPanelState(deviceType: DeviceType, state: boolean) {
    switch (deviceType) {
      case DeviceType.Tympan:
        this.stateModel.updatePaneOpen({ tympans: state });
        break;
      case DeviceType.Wahts:
        this.stateModel.updatePaneOpen({ wahts: state });
        break;
      default:
        deviceType satisfies never;
        break;
    }
  }

  toggleDeviceExpanded(device: IDevice) {
    const currentState = this.expanded.get(device.deviceId) ?? false;
    this.expanded.set(device.deviceId, !currentState);
  }
}
