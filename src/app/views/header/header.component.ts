import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType, ExamState } from '../../utilities/constants';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { Notifications } from '../../utilities/notifications.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../utilities/logger.service';
import { StateInterface } from '../../models/state/state.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Subscription } from 'rxjs';
import { ChangePinComponent } from '../change-pin/change-pin.component';
import { MatDialog } from '@angular/material/dialog';
import { AppModel } from '../../models/app/app.service';
import { AppInterface } from '../../models/app/app.interface';
import { DisclaimerComponent } from '../disclaimer/disclaimer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  state: StateInterface;
  ExamState = ExamState;
  AppState = AppState;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  app: AppInterface;
  constructor(
    private readonly examService: ExamService,
    private readonly dialog: MatDialog,
    private readonly diskModel: DiskModel,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly stateModel: StateModel,
    private readonly appModel: AppModel,
    private readonly router: Router
  ) {
    this.state = this.stateModel.getState();
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();
    if (this.disk.init && !this.app.browser) {
      this.dialog.open(DisclaimerComponent).afterClosed().subscribe(() => {
        this.diskModel.updateDiskModel("init", false);
      });
    }
  }

  resetExam() {
    let msg: DialogDataInterface = {
      title: "Confirm Exam Reset",
      content: "Are you sure you want to reset the exam and discard partial results?",
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        this.examService.reset();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

  submitPartialExam() {
    let msg: DialogDataInterface = {
      title: "Confirm Submit Partial Results",
      content: "Are you sure you want to reset the exam and submit partial results?",
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        this.examService.submitPartial();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

  onAdminViewClick() {
    if (!this.disk.debugMode) {
      const dialogRef = this.dialog.open(ChangePinComponent);
      dialogRef.componentInstance.setValidationMode(true);
      dialogRef.componentInstance.pinValidated.subscribe((isValid: boolean) => {
        if (isValid) {
          this.router.navigate(['/admin']);
        } 
      });
    }  else {
      this.router.navigate(['/admin']);
    }
  }

}
