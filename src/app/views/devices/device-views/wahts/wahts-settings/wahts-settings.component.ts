import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../../models/state/state.interface';

import { DiskModel } from '../../../../../models/disk/disk.service';
import { StateModel } from '../../../../../models/state/state.service';

import { AppState, DeviceState } from '../../../../../utilities/constants';
import { MatDialog } from '@angular/material/dialog';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { IWahtsDevice } from '../../../../../interfaces/devices/wahts-device.interface';

@Component({
  selector: 'app-wahts-settings',
  templateUrl: './wahts-settings.component.html',
})
export class WahtsSettingsComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);
  private readonly transloco = inject(TranslocoService);
  private readonly dialog = inject(MatDialog);
  private readonly devicesService = inject(DevicesService);

  @Input() device!: IWahtsDevice;
  DeviceState = DeviceState;

  disk: DiskInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  devicesSubscription: Subscription | undefined;

  constructor() {
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

  toggleDisableAudioStreaming(): void {
    this.diskModel.updatePreferences({ disableAudioStreaming: !this.disk.preferences.disableAudioStreaming });
  }

  toggleEnableHeadsetMediaManagement(): void {
    this.diskModel.updatePreferences({ enableHeadsetMediaManagement: !this.disk.preferences.enableHeadsetMediaManagement });
  }
}
