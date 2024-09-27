import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { AppState, BluetoothType, ChaState } from '../../utilities/constants';
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
  ChaState = ChaState;
  BluetoothType = BluetoothType;

  constructor(
    private diskModel: DiskModel, 
    private logger: Logger, 
    private stateModel: StateModel,
    private translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  connectCha() {
    console.log("connect pressed");
  }

  cancelConnectCha() {
    console.log("cancelConnect pressed");
  }

  disconnectCha() {
    console.log("disconnect pressed");
  }

  removeCha() {
    console.log("removeCha pressed");
  }

  changeBluetoothType(type: string) {
    if (type === BluetoothType.BLUETOOTH_LE || type === BluetoothType.BLUETOOTH || type === BluetoothType.USB) {
      if (this.disk.cha.bluetoothType !== type) {
        this.logger.debug("set cha bluetooth type to " + type);
        this.disconnectCha();
        this.diskModel.updateDiskModel("cha",{
          embeddedFirmwareBuildDate: "",
          embeddedFirmwareTag: "",
          myCha: "",
          bluetoothType: type
      });
      }
    } else {
      this.logger.debug("attempting to set cha bluetooth type to " + type);
    }
  }

  bluetoothTypePopover = this.translate.instant(
    "Set the bluetooth type for connecting to the WAHTS. <br /><br /><b>Bluetooth 2.0</b> is used for the handheld WAHTS <br /><b>Bluetooth 3.0</b> is used for the Creare Wireless Headset"
  );
  

}
