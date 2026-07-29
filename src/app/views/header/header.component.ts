import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState, DialogType, ExamState } from '../../utilities/constants';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';
import { Notifications } from '../../services/notifications.service';
import { ExamService } from '../../controllers/exam.service';
import { Logger } from '../../services/logger.service';
import { StateInterface } from '../../models/state/state.interface';
import { ProtocolModel } from '../../models/protocol/protocol-model.service';
import { ProtocolModelInterface } from '../../models/protocol/protocol.interface';
import { NavMenuInterface } from '../../interfaces/page-definition.interface';
import { isProtocolReferenceInterface } from '../../guards/type.guard';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Subscription } from 'rxjs';
import { AppModel } from '../../models/app/app.service';
import { AppInterface } from '../../models/app/app.interface';
import { AdminService } from '../../controllers/admin.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';
import { scanQrCodeAndAutoConfig } from '../../utilities/qr-scan';
import { QrService } from '../../services/qr.service';

@Component({
  selector: 'app-header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  public adminService = inject(AdminService);
  private readonly appModel = inject(AppModel);
  private readonly diskModel = inject(DiskModel);
  private readonly examService = inject(ExamService);
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly pageModel = inject(PageModel);
  private readonly protocolM = inject(ProtocolModel);
  private readonly stateModel = inject(StateModel);
  private readonly qrService = inject(QrService);

  state: StateInterface;
  protocol: ProtocolModelInterface;
  ExamState = ExamState;
  AppState = AppState;
  disk: DiskInterface;
  currentPage: PageInterface;
  app: AppInterface;
  pageSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.protocol = this.protocolM.getProtocolModel();
    this.disk = this.diskModel.getDisk();
    this.app = this.appModel.getApp();
    this.currentPage = this.pageModel.getPage();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  resetExam() {
    const msg: DialogDataInterface = {
      title: 'Confirm Exam Reset',
      content: 'Are you sure you want to reset the exam and discard partial results?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        this.examService.reset();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

  submitPartialExam() {
    const msg: DialogDataInterface = {
      title: 'Confirm Submit Partial Results',
      content: 'Are you sure you want to reset the exam and submit partial results?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        this.examService.submitPartial();
      } else {
        this.logger.debug('Reset exam canceled.');
      }
    });
  }

  /** The current page's title, inherited from the nearest ancestor protocol if the page has none of its own. */
  get pageTitle(): string | undefined {
    return this.currentPage.title ?? this.protocol.activeProtocolStack.resolveInheritedTitle();
  }

  navigateToNavMenuItem(navMenuItem: NavMenuInterface) {
    const contentStr = navMenuItem.returnHereAfterward
      ? 'TabSINT will navigate to the selected sub-protocol, then return to this page and resume the current series of questions after that sub-protocol is complete.'
      : 'Results from this page will be lost and the current series of questions will be aborted.';
    const msg: DialogDataInterface = {
      title: navMenuItem.text + '?',
      content: contentStr,
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(async (result: string) => {
      if (result === 'OK') {
        if (isProtocolReferenceInterface(navMenuItem.target)) {
          this.examService.navigateToTarget(navMenuItem.target.reference);
          this.stateModel.updateState({
            examState: ExamState.Testing,
            deviceError: [],
          });
        } else {
          this.logger.debug('navigateToNavMenuItem() not implemented for inline pages or subprotocol, only for protocol reference.');
        }
      } else {
        this.logger.debug('navigateToNavMenuItem() canceled.');
      }
    });
  }

  async qrScanHandler() {
    scanQrCodeAndAutoConfig({
      qrService: this.qrService,
      diskModel: this.diskModel,
      notifications: this.notifications,
    });
  }
}
