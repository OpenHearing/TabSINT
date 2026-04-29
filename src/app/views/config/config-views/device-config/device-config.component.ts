import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AppState } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-device-config-view',
  templateUrl: './device-config.component.html',
  styleUrl: './device-config.component.css',
})
export class DeviceConfigComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);

  state: StateInterface;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }
}
