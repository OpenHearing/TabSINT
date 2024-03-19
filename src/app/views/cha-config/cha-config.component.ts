import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AdminService } from '../../controllers/admin.service';
import { ConfigService } from '../../controllers/config.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'cha-config-view',
  templateUrl: './cha-config.component.html',
  styleUrl: './cha-config.component.css'
})
export class ChaConfigComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public adminService: AdminService,
    public configService: ConfigService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  // VARIABLES - PROBABLY SHOULD BE MOVED?

  bluetoothStatus = {
    state: true
  }

  cha = {
    state: "disconnected",
    connect: function() {console.log("connect pressed");},
    cancelConnect: function() {console.log("cancelConnect pressed");},
    disconnect: function() {console.log("disconnect pressed");}
  };


  // Functions

  removeCha() {
    console.log("removeCha pressed");
  }


}
