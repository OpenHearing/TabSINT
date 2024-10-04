import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiskModel } from '../../../../models/disk/disk.service';
import { AppState } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css'
})
export class DeviceInfoComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    private readonly diskModel: DiskModel, 
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  // VARIABLES - PROBABLY SHOULD BE MOVED?

  tympan = {
    myTympan: {
      id: {
        serialNumber: "placeholder",
        buildDateTime: "placeholder",
        tympanCalibrationDate: "placeholder",
        description: "placeholder",
      }
    }
  };


  // Popovers

  setShutdownTimerPopover = this.translate.instant(
    "Auto shutdown time (in minutes) for the WAHTS headset."
  );

  
}
