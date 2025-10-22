import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class IndicatorComponent implements OnInit, OnDestroy {
  disk: DiskInterface;  
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
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

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState) => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
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
