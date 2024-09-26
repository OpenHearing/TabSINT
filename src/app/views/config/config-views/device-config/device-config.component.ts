import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../../../models/disk/disk.service';
import { Logger } from '../../../../utilities/logger.service';
import { FileService } from '../../../../utilities/file.service';
import { AdminService } from '../../../../controllers/admin.service';
import { ConfigService } from '../../../../controllers/config.service';
import { AppState, TympanState } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { TympanService } from '../../../../controllers/tympan.service';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { DevicesInterface } from '../../../../models/devices/devices.interface';

@Component({
  selector: 'device-config-view',
  templateUrl: './device-config.component.html',
  styleUrl: './device-config.component.css'
})
export class DeviceConfigComponent {
  disk: DiskInterface;
  state: StateInterface;
  devices: DevicesInterface;
  TympanState = TympanState;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public adminService: AdminService,
    public configService: ConfigService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService,
    public tympanService: TympanService,
    public deviceModel: DevicesModel
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.devices = this.deviceModel.getDevices();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

}
