import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { TranslateService } from '@ngx-translate/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { SvantekState } from '../../utilities/constants';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {
  disk: DiskInterface;  
  state: StateInterface;
  SvantekState = SvantekState;

  constructor(
    public diskModel:DiskModel, 
    public stateModel: StateModel,
    public translate:TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
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

  DosimeterConnectedPopover = this.translate.instant(
    "Dosimeter Connected"
  );

  StreamingConnectionPopover = this.translate.instant(
    "Streaming Connection Established"
  );
}
