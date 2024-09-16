import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../utilities/file.service';
import { AdminService } from '../../controllers/admin.service';
import { ConfigService } from '../../controllers/config.service';
import { AppState, BluetoothType, TympanState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { TympanService } from '../../controllers/tympan.service';
import { TympanModel } from '../../models/tympan/tympan-model.service';
import { MyTympanInterface } from '../../models/tympan/tympan.interface';

@Component({
  selector: 'tympan-config-view',
  templateUrl: './tympan-config.component.html',
  styleUrl: './tympan-config.component.css'
})
export class TympanConfigComponent {
  disk: DiskInterface;
  state: StateInterface;
  myTympans: MyTympanInterface;
  TympanState = TympanState;
  BluetoothType = BluetoothType;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public adminService: AdminService,
    public configService: ConfigService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService,
    public tympanService: TympanService,
    public tympanModel: TympanModel
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.myTympans = this.tympanModel.getMyTympans();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  tympanTest() {
    console.log("myTympans:"+JSON.stringify(this.myTympans));
  }

  async connectTympan() {
    console.log("connect tympan pressed");
    await this.tympanService.connect();
  }

  cancelConnectTympan() {
    console.log("cancelConnect tympan pressed");
  }

  disconnectTympan() {
    console.log("disconnect tympan pressed");
  }

  removeTympan() {
    console.log("removeTympan pressed");
  }
  

}
