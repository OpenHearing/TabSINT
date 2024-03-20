import { Component } from '@angular/core';

import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';

@Component({
  selector: 'debug-view',
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.css'
})
export class DebugComponent {
  disk: DiskInterface;

  constructor(public diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

  isCollapsed = true;

  formatNumber(i:number) {
    return Math.round(i * 10) / 10;
  };
}
