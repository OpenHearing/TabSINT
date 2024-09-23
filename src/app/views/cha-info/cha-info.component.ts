import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'cha-info-view',
  templateUrl: './cha-info.component.html',
  styleUrl: './cha-info.component.css'
})
export class ChaInfoComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    private diskModel: DiskModel, 
    private stateModel: StateModel,
    private translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  // VARIABLES - PROBABLY SHOULD BE MOVED?

  cha = {
    myCha: {
      setting: {
        auto_shutdown_time: "x"
      },
      battery: {
        level: () => {return "placeholder"}
      },
      id: {
        serialNumber: "placeholder",
        buildDateTime: "placeholder",
        chaCalibrationDate: "placeholder",
        description: "placeholder",
      },
      name: "placeholder",
      batteryIndicatorWidth: "placeholder"
    }
  };


  // Popovers

  setShutdownTimerPopover = this.translate.instant(
    "Auto shutdown time (in minutes) for the WAHTS headset."
  );

  
}
