import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { TranslateService } from '@ngx-translate/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { DeviceState, SvantekState } from '../../utilities/constants';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DevicesInterface } from '../../models/devices/devices.interface';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {
  disk: DiskInterface;  
  state: StateInterface;
  devices: DevicesInterface;
  SvantekState = SvantekState;
  DeviceState = DeviceState;

  constructor(
    private readonly diskModel:DiskModel, 
    private readonly stateModel: StateModel,
    private readonly translate:TranslateService,
    private readonly deviceModel: DevicesModel
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.devices = this.deviceModel.getDevices();
  }

  WiFiNotConnectedPopover = this.translate.instant(
    "WiFi Not Connected"
  );

  WiFiConnectedPopover = this.translate.instant(
    "WiFi Connected"
  );

  BluetoothConnectedPopover = this.translate.instant(
    "Bluetooth Connected"
  );

  TympanConnectedPopover = this.translate.instant(
    "Tympan Connected"
  );

  DosimeterConnectedPopover = this.translate.instant(
    "Dosimeter Connected"
  );

  StreamingConnectionPopover = this.translate.instant(
    "Streaming Connection Established"
  );
}
