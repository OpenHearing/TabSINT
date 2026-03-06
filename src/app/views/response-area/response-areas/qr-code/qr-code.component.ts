import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageInterface } from '../../../../models/page/page.interface';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';

import { StateModel } from '../../../../models/state/state.service';
import { QrCodeResponseAreaInterface, QrCodeResponseAreaScope } from './qr-code.interface';
import { qrCodeResponseAreaSchema } from '../../../../../schema/response-areas/qr-code.schema';
import { QrService } from '../../../../services/qr.service';
import { Notifications } from '../../../../services/notifications.service';
import { DialogType } from '../../../../utilities/constants';
import { ExamService } from '../../../../controllers/exam.service';

@Component({
  selector: 'app-qr-code-response-area',
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css',
})
export class QrCodeResponseAreaComponent implements OnInit, OnDestroy {
  private readonly notifications = inject(Notifications);
  private readonly pageModel = inject(PageModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly stateModel = inject(StateModel);
  private readonly qrService = inject(QrService);
  private readonly examService = inject(ExamService);

  qrExamProperties: QrCodeResponseAreaInterface = {
    type: qrCodeResponseAreaSchema.properties.type.default,
    scope: qrCodeResponseAreaSchema.properties.scope.default,
    autoSubmit: qrCodeResponseAreaSchema.properties.autoSubmit.default,
  };
  qrData?: string;
  pageSubscription: Subscription | undefined;

  constructor() {
    /* empty */
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'qrCodeResponseArea') {
        this.qrExamProperties.scope = (updatedPage.responseArea as QrCodeResponseAreaInterface).scope;
        this.qrExamProperties.autoSubmit = (updatedPage.responseArea as QrCodeResponseAreaInterface).autoSubmit;
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Scan a QR code and update the exam properties based on scope.
   */
  async scanCode() {
    let scanResult = await this.qrService.scan();
    if (scanResult?.trim().length === 0) {
      scanResult = undefined;
    }
    this.qrData = scanResult;

    switch (this.qrExamProperties.scope) {
      case QrCodeResponseAreaScope.Page:
        this.resultsModel.updateCurrentPage({ response: scanResult });
        break;
      case QrCodeResponseAreaScope.Exam:
        this.resultsModel.updateCurrentPage({ response: scanResult });
        this.resultsModel.updateCurrentExam({ qrString: scanResult });
        break;
      default:
        this.qrExamProperties.scope satisfies never;
        break;
    }

    if (scanResult) {
      this.stateModel.updateState({ doesResponseExist: true });
      this.stateModel.setPageSubmittable();
      this.notifications.alert({
        title: 'QR Code',
        content: 'QR code scanned successfully.',
        type: DialogType.Alert,
      });
      if (this.qrExamProperties.autoSubmit) {
        this.examService.submit();
      }
    } else {
      this.notifications.alert({
        title: 'QR Code',
        content: 'Failed to scan the QR code.',
        type: DialogType.Alert,
      });
    }
  }
}
