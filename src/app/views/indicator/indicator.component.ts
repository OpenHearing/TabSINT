import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { DevicesInterface } from '../../models/devices/devices.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { DevicesModel } from '../../models/devices/devices-model.service';

import { DeviceState, SvantekState } from '../../utilities/constants';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {
  disk: DiskInterface;  
  diskSubject: Subscription | undefined;
  state: StateInterface;
  devices: DevicesInterface;
  SvantekState = SvantekState;
  DeviceState = DeviceState;

  constructor(
    private readonly deviceModel: DevicesModel,
    private readonly diskModel: DiskModel, 
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.devices = this.deviceModel.getDevices();
  }

  ngOnInit() {
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
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
