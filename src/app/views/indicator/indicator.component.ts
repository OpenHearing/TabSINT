import { Component, OnDestroy, OnInit } from '@angular/core';
import { map, Observable, Subscription } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';

import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';

import { DeviceState, DeviceType, SvantekState } from '../../utilities/constants';
import { DevicesService } from '../../services/devices/devices.service';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css',
})
export class IndicatorComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;
  state: StateInterface;
  SvantekState = SvantekState;
  hasConnectedTympan: Observable<boolean>;
  hasConnectedWahts: Observable<boolean>;
  hasConnectedDuodose: Observable<boolean>;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly transloco: TranslocoService
  ) {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.hasConnectedTympan = this.devicesService.devices.pipe(
      map(devices => devices.some(device => device.type === DeviceType.Tympan && device.state === DeviceState.Connected))
    );
    this.hasConnectedWahts = this.devicesService.devices.pipe(
      map(devices => devices.some(device => device.type === DeviceType.Wahts && device.state === DeviceState.Connected))
    );
    this.hasConnectedDuodose = this.devicesService.devices.pipe(
      map(devices => devices.some(device => device.type === DeviceType.Duodose && device.state === DeviceState.Connected))
    );
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  get WiFiNotConnectedPopover() { return this.transloco.translate('WiFi Not Connected'); }
  get WiFiConnectedPopover() { return this.transloco.translate('WiFi Connected'); }
  get BluetoothConnectedPopover() { return this.transloco.translate('Bluetooth Connected'); }
  get TympanConnectedPopover() { return this.transloco.translate('Tympan Connected'); }
  get WahtsConnectedPopover() { return this.transloco.translate('WAHTS Connected'); }
  get DuodoseConnectedPopover() { return this.transloco.translate('DuoDose Connected'); }
  get DosimeterConnectedPopover() { return this.transloco.translate('Dosimeter Connected'); }
  get StreamingConnectionPopover() { return this.transloco.translate('Streaming Connection Established'); }
}
