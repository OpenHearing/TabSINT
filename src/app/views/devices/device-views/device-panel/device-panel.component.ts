import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { map, Observable, Subscription } from 'rxjs';

import { DeviceState, DeviceType, DialogType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DevicesService } from '../../../../services/devices/devices.service';
import { StateModel } from '../../../../models/state/state.service';
import { Notifications } from '../../../../services/notifications.service';

@Component({
  selector: 'app-device-panel',
  templateUrl: './device-panel.component.html',
})
export class DevicePanelComponent implements OnInit, OnDestroy {
  @Input() deviceType!: DeviceType;

  private readonly devicesService = inject(DevicesService);
  private readonly stateModel = inject(StateModel);
  private readonly notifications = inject(Notifications);

  DeviceType = DeviceType;
  DeviceState = DeviceState;

  devices$!: Observable<IDevice[]>;
  state: StateInterface;

  maxDevices = 3;
  activeScanType: DeviceType | undefined = undefined;

  private stateSubscription: Subscription | undefined;
  private scanSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.maxDevices = this.deviceType === DeviceType.Svantek ? 1 : 3;

    this.devices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === this.deviceType && d.state !== DeviceState.Discovery))
    );

    this.stateSubscription = this.stateModel.stateSubject.subscribe(updated => {
      this.state = updated;
    });

    this.scanSubscription = this.devicesService.activeScanType.subscribe(activeType => {
      this.activeScanType = activeType;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
    this.scanSubscription?.unsubscribe();
  }

  async addNewConnection(): Promise<void> {
    try {
      await this.devicesService.startDeviceSearch(this.deviceType);
      await this.devicesService.deviceConnectionDialog(this.deviceType);
    } catch {
      this.notifications
        .alert({
          title: 'Search Failed',
          content: 'Unable to start a device search.',
          type: DialogType.Alert,
        })
        .subscribe();
    } finally {
      await this.devicesService.stopDeviceSearch(this.deviceType);
    }
  }

  async cancelNewConnection(): Promise<void> {
    await this.devicesService.stopDeviceSearch(this.deviceType);
  }
}
