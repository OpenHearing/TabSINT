import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../models/disk/disk.interface';
import { AppInterface } from '../../models/app/app.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { AppModel } from '../../models/app/app.service';

import { DisclaimerComponent } from '../disclaimer/disclaimer.component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  app: AppInterface;

  constructor(
    private readonly appModel: AppModel,
    private readonly dialog: MatDialog,
    private readonly diskModel: DiskModel,
  ) {
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();

    if (this.disk.init && !this.app.browser) {
      this.dialog.open(DisclaimerComponent).afterClosed().subscribe(() => {
        this.diskModel.updateDiskModel("init", false);
      });
    }
  }

  ngOnInit() {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  // TODO: Replace this variable with a model?
  config:any = {};


  scanQrCodeandAutoConfig() {
    console.log("scanQrCodeandAutoConfig() called from welcome.component.ts");
  }
}
