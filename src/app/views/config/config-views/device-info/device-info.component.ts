import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiskModel } from '../../../../models/disk/disk.service';
import { AppState } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { DevicesModel } from '../../../../models/devices/devices-model.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css'
})
export class DeviceInfoComponent {
  disk: DiskInterface;
  state: StateInterface;
  devices: DevicesInterface;

  constructor(
    private readonly diskModel: DiskModel, 
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
    private readonly devicesModel: DevicesModel
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.devices = this.devicesModel.getDevices();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  setShutdownTimerPopover = this.translate.instant(
    "Auto shutdown time (in minutes) for the WAHTS headset."
  );

}
