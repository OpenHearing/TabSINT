import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { map, Observable, Subscription } from 'rxjs';

import { DeviceState, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DevicesService } from '../../../../services/devices/devices.service';
import { StateModel } from '../../../../models/state/state.service';

@Component({
  selector: 'app-device-panel',
  templateUrl: './device-panel.component.html',
})
export class DevicePanelComponent implements OnInit, OnDestroy {
  @Input() deviceType!: DeviceType;

  private readonly devicesService = inject(DevicesService);
  private readonly stateModel = inject(StateModel);

  DeviceType = DeviceType;
  DeviceState = DeviceState;

  devices$!: Observable<IDevice[]>;
  state: StateInterface;

  maxDevices = 3;
  scanning = false;

  private stateSubscription: Subscription | undefined;

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
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  async addNewConnection(): Promise<void> {
    this.scanning = true;
    try {
      await this.devicesService.startDeviceSearch(this.deviceType);
      await this.devicesService.deviceConnectionDialog(this.deviceType);
    } finally {
      await this.devicesService.stopDeviceSearch(this.deviceType);
      this.scanning = false;
    }
  }

  async cancelNewConnection(): Promise<void> {
    await this.devicesService.stopDeviceSearch(this.deviceType);
    this.scanning = false;
  }
}
