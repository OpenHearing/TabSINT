import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppState } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';


@Component({
  selector: 'device-config-view',
  templateUrl: './device-config.component.html',
  styleUrl: './device-config.component.css'
})
export class DeviceConfigComponent {
  state: StateInterface

  constructor(
    private readonly stateModel: StateModel,
    private readonly translate: TranslateService
  ) {
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.state.appState = AppState.Admin;
  }

}
