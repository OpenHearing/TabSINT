import { Component } from '@angular/core';
import { DiskM } from '../../models/disk/disk.service';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {

  constructor(public diskM:DiskM) {  }

  bluetoothStatus:any = {};
  networkModel:any = {};
  svantek:any = {};
  chaStreaming:any = {};
}
