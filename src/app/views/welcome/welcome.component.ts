import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Tasks } from '../../utilities/tasks.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
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
    public adminService: AdminService
  ) {
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
      this.state = updatedState;
    });
    this.stateModel.updateState({appState: AppState.Welcome});
    this.tasks.hide();
  }

  ngOnDestroy(): void {
    this.stateModel.updateState({appState: AppState.null});
    this.tasks.unhide();
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  // TODO: Replace this variable with a model?
  config:any = {};


  scanQrCodeandAutoConfig() {
    console.log("scanQrCodeandAutoConfig() called from welcome.component.ts");
  }

}
