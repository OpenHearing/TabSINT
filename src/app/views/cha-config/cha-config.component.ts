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

  bluetoothStatus = {
    state: true
  };

  cha = {
    state: "disconnected",
    connect: function() {console.log("connect pressed");},
    cancelConnect: function() {console.log("cancelConnect pressed");},
    disconnect: function() {console.log("disconnect pressed");},
    bluetoothType: "Bluetooth 2.0"
  };

  bluetoothTypes:any = {
    BLUETOOTH: "Bluetooth 2.0",
    BLUETOOTH_LE: "Bluetooth 3.0",
    USB: "USB Host"
  };

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

  removeCha() {
    console.log("removeCha pressed");
  }

  changeBluetoothType(type:any) {
    console.log("changeBluetoothType pressed");
    if (type === "BLUETOOTH_LE" || type === "BLUETOOTH" || type === "USB") {
      if (this.cha.bluetoothType !== type) {
        this.logger.debug("set cha bluetooth type to " + type);
        this.cha.bluetoothType = type;
        this.cha.disconnect();
        this.disk.cha.bluetoothType = type;
        this.disk.cha.myCha = "";
      }
    } else {
      this.logger.debug("attempting to set cha bluetooth type to " + type);
    }
  }

  getBluetoothType() {
    return this.cha.bluetoothType
  }

  bluetoothTypePopover = this.translate.instant(
    "Set the bluetooth type for connecting to the WAHTS. <br /><br /><b>Bluetooth 2.0</b> is used for the handheld WAHTS <br /><b>Bluetooth 3.0</b> is used for the Creare Wireless Headset"
  );
  

}
