import { Component } from '@angular/core';
import { Subscription } from 'rxjs';


import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
@Component({
  selector: 'debug-view',
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.css'
})
export class DebugComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  constructor(private readonly diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit() {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  isCollapsed = true;

  formatNumber(i:number) {
    return Math.round(i * 10) / 10;
  };
}
