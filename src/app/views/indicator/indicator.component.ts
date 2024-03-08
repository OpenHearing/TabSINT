import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';

@Component({
  selector: 'indicator-view',
  templateUrl: './indicator.component.html',
  styleUrl: './indicator.component.css'
})
export class IndicatorComponent {
  disk: DiskInterface;

  constructor(public diskModel:DiskModel) { 
    this.disk = this.diskModel.getDisk();
  }
  
  bluetoothStatus:any = {};
  networkModel:any = {};
  svantek:any = {};
  chaStreaming:any = {};
}
