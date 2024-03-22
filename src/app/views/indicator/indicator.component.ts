import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {
  disk: DiskInterface;

  constructor(public diskModel:DiskModel, public translate:TranslateService) { 
    this.disk = this.diskModel.getDisk();
  }
  
  bluetoothStatus:any = {};
  networkModel:any = {};
  svantek:any = {};
  chaStreaming:any = {};

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
