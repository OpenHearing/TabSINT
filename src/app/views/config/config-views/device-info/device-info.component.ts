import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../models/state/state.interface';

import { DiskModel } from '../../../../models/disk/disk.service';
import { StateModel } from '../../../../models/state/state.service';

import { AppState } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { ChangeTabsintIdComponent } from '../../../change-tabsint-id/change-tabsint-id.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'device-info-view',
  templateUrl: './device-info.component.html',
  styleUrl: './device-info.component.css',
})
export class DeviceInfoComponent implements OnInit, OnDestroy {
  @Input() device!: IDevice;
  disk: DiskInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor(
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService,
    private readonly dialog: MatDialog
  ) {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  editTabsintId(device: IDevice): void {
    this.dialog.open(ChangeTabsintIdComponent, { data: device });
  }

  setShutdownTimerPopover = this.translate.instant('Auto shutdown time (in minutes) for the WAHTS headset.');

  setTabsintIdPopover = this.translate.instant('Set the unique TabSINT ID for the device.');
}
