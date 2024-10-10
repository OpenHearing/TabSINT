import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { DevicesInterface } from '../../../../models/devices/devices.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';
import { DevicesModel } from '../../../../models/devices/devices-model.service';

import { AppState } from '../../../../utilities/constants';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css'
})
export class DeviceInfoComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  state: StateInterface;
  devices: DevicesInterface;

  constructor(
    private readonly devicesModel: DevicesModel,
    private readonly diskModel: DiskModel, 
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.devices = this.devicesModel.getDevices();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.stateModel.setAppState(AppState.Admin);
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  setShutdownTimerPopover = this.translate.instant(
    "Auto shutdown time (in minutes) for the WAHTS headset."
  );

}
