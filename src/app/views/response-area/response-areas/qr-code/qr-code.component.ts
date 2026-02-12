import { Component, OnDestroy, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-qr-code-response-area',
  templateUrl: './qr-code.component.html',
  styleUrl: './qr-code.component.css',
})
export class QrCodeResponseAreaComponent implements OnInit, OnDestroy {
  scope: QrCodeResponseAreaScope;
  qrData?: string;

  pageSubscription: Subscription | undefined;

  constructor(
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel,
    private readonly stateModel: StateModel,
    private readonly qrService: QrService,
    private readonly notifications: Notifications
  ) {
    this.scope = qrCodeResponseAreaSchema.properties.scope.default;
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'qrCodeResponseArea') {
        this.scope = (updatedPage.responseArea as QrCodeResponseAreaInterface).scope;
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

    switch (this.scope) {
      case QrCodeResponseAreaScope.Page:
        this.resultsModel.updateCurrentPage({ response: scanResult });
        break;
      case QrCodeResponseAreaScope.Exam:
        this.resultsModel.updateCurrentPage({ response: scanResult });
        this.resultsModel.updateCurrentExam({ qrString: scanResult });
        break;
      default:
        this.scope satisfies never;
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
    } else {
      this.notifications.alert({
        title: 'QR Code',
        content: 'Failed to scan the QR code.',
        type: DialogType.Alert,
      });
    }
  }
}
