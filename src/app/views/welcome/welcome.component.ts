import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../models/disk/disk.interface';
import { AppInterface } from '../../models/app/app.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { AppModel } from '../../models/app/app.service';
import { Router } from '@angular/router';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType } from '../../utilities/constants';
import { StateInterface } from '../../models/state/state.interface';
import { AdminService } from '../../controllers/admin.service';
import { Tasks } from '../../services/tasks.service';
import { QrService } from '../../services/qr.service';
import { preferencesSchema } from '../../../schema/definitions/preferences.schema';
import { Notifications } from '../../services/notifications.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  app: AppInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly appModel: AppModel,
    private readonly dialog: MatDialog,
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly router: Router,
    private readonly tasks: Tasks,
    public adminService: AdminService,
    private readonly qrService: QrService,
    private readonly notifications: Notifications
  ) {
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Welcome });
    this.tasks.hide();
  }

  ngOnDestroy(): void {
    this.stateModel.updateState({ appState: AppState.null });
    this.tasks.unhide();
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Scan the configuration QR code and adjust the preferences.
   */
  async scanQrCodeandAutoConfig() {
    const preferences = await this.qrService.scan(preferencesSchema);
    if (preferences) {
      this.diskModel.updatePreferences(preferences);
      this.notifications.alert({
        title: 'QR Code',
        content: 'QR code scanned successfully, configuration has been updated.',
        type: DialogType.Alert,
      });
    } else {
      this.notifications.alert({
        title: 'QR Code',
        content: 'Failed to configure the application with the provided QR code.',
        type: DialogType.Alert,
      });
    }
  }
}
