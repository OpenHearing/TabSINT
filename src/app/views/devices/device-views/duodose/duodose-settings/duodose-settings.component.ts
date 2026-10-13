import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../../../../models/disk/disk.interface';
import { StateInterface } from '../../../../../models/state/state.interface';

import { DiskModel } from '../../../../../models/disk/disk.service';
import { StateModel } from '../../../../../models/state/state.service';

import { AppState, DeviceState } from '../../../../../utilities/constants';

@Component({
  selector: 'app-duodose-settings',
  templateUrl: './duodose-settings.component.html',
})
export class DuodoseSettingsComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);

  @Input() deviceId!: string;
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
}
