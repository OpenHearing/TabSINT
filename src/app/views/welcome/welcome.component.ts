import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { AppModel } from '../../models/app/app.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { AppInterface } from '../../models/app/app.interface';
import { MatDialog } from '@angular/material/dialog';
import { DisclaimerComponent } from '../disclaimer/disclaimer.component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  disk: DiskInterface;
  app: AppInterface;

  constructor(
    private diskModel: DiskModel,
    private appModel: AppModel,
    private dialog: MatDialog
  ) {
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();

    if (this.disk.init && !this.app.browser) {
      this.dialog.open(DisclaimerComponent).afterClosed().subscribe(() => {
        this.diskModel.updateDiskModel("init", false);
        this.disk = this.diskModel.getDisk();
      });
    }
  }

  // TODO: Replace this variable with a model?
  config:any = {};


  scanQrCodeandAutoConfig() {
    console.log("scanQrCodeandAutoConfig() called from welcome.component.ts");
  }
}
