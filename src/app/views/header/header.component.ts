import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType, ExamState } from '../../utilities/constants';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { Notifications } from '../../utilities/notifications.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../utilities/logger.service';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { NavMenuInterface } from '../../interfaces/page-definition.interface';
import { isProtocolReferenceInterface } from '../../guards/type.guard';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AppModel } from '../../models/app/app.service';
import { AppInterface } from '../../models/app/app.interface';
import { DisclaimerComponent } from '../disclaimer/disclaimer.component';
import { AdminService } from '../../controllers/admin.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  state: StateInterface;
  protocol: ProtocolModelInterface;
  ExamState = ExamState;
  AppState = AppState;
  disk: DiskInterface;
  currentPage: PageInterface;
  app: AppInterface;
  pageSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;

  constructor(
    public adminService: AdminService,
    private readonly appModel: AppModel,
    private readonly dialog: MatDialog,
    private readonly diskModel: DiskModel,
    private readonly examService: ExamService,
    private readonly logger: Logger,
    private readonly notifications: Notifications,
    private readonly pageModel: PageModel,
    private readonly protocolM: ProtocolModel,
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.protocol = this.protocolM.getProtocolModel();
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();
    if (this.disk.init && !this.app.browser) {
      this.dialog.open(DisclaimerComponent).afterClosed().subscribe(() => {
        this.diskModel.updateDiskModel("init", false);
      });
    }
    this.currentPage = this.pageModel.getPage();
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
        this.currentPage = updatedPage;
    });
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

  navigateToNavMenuItem(navMenuItem: NavMenuInterface) {
    const contentStr = navMenuItem.returnHereAfterward
      ? "TabSINT will navigate to the selected sub-protocol, then return to this page and resume the current series of questions after that sub-protocol is complete."
      : "Results from this page will be lost and the current series of questions will be aborted."
    let msg: DialogDataInterface = {
      title: navMenuItem.text + "?",
      content: contentStr,
      type: DialogType.Confirm
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === "OK") {
        if (isProtocolReferenceInterface(navMenuItem.target)) {
          this.examService.navigateToTarget(navMenuItem.target.reference);
        } else {
          this.logger.debug('navigateToNavMenuItem() not implemented for inline pages or subprotocol, only for protocol reference.')
        }        
      } else {
        this.logger.debug('navigateToNavMenuItem() canceled.');
      }
    });
  }

}
