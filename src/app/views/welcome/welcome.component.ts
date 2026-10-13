import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../models/disk/disk.interface';
import { AppInterface } from '../../models/app/app.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { AppModel } from '../../models/app/app.service';
import { Router } from '@angular/router';
import { StateModel } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';
import { StateInterface } from '../../models/state/state.interface';
import { AdminService } from '../../controllers/admin.service';
import { Tasks } from '../../services/tasks.service';
import { QrScanService } from '../../services/qr-scan.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent implements OnInit, OnDestroy {
  private readonly appModel = inject(AppModel);
  private readonly dialog = inject(MatDialog);
  private readonly diskModel = inject(DiskModel);
  private readonly stateModel = inject(StateModel);
  private readonly router = inject(Router);
  private readonly tasks = inject(Tasks);
  readonly adminService = inject(AdminService);
  private readonly qrScanService = inject(QrScanService);

  disk: DiskInterface;
  app: AppInterface;
  state: StateInterface;

  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
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
  async qrScanHandler() {
    this.qrScanService.scanAndAutoConfig();
  }
}
