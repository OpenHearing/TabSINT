import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import _ from 'lodash';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ExamResults } from '../../models/results/results.interface';

import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { ResultsModel } from '../../models/results/results-model.service';
import { ResultsService } from '../../controllers/results.service';
import { SqLite } from '../../services/sqLite.service';
import { Logger } from '../../services/logger.service';

import { SingleResultModalComponent } from '../single-result-modal/single-result-modal/single-result-modal.component';
import { DialogType } from '../../utilities/constants';
import { Notifications } from '../../services/notifications.service';
import { ResultsUploadService } from '../../controllers/results-upload.service';
import { DialogDataInterface } from '../../interfaces/dialog-data.interface';

@Component({
  selector: 'results-view',
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
})
export class ResultsComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  state: StateInterface;
  index: number = 0;
  results?: ExamResults[];
  stateSubscription: Subscription | undefined;

  constructor(
    public dialog: MatDialog,
    public diskModel: DiskModel,
    public resultsModel: ResultsModel,
    public resultsService: ResultsService,
    public sqLite: SqLite,
    private readonly resultsUploadService: ResultsUploadService,
    private readonly notifications: Notifications,
    public stateModel: StateModel,
    private readonly logger: Logger
  ) {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.asyncNgOnInit();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnIit to handle any asynchronous operations.
   */
  private async asyncNgOnInit(): Promise<void> {
    this.results = await this.resultsService.getAllResults();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * View detailed exam results from a single exam.
   * @summary Open a modal component to view exam results details. The user may export, upload or close the window.
   * @models disk
   * @param index: index of the result to open from the sqLite database.
   */
  viewResult(index: number) {
    this.dialog
      .open(SingleResultModalComponent, {
        data: index,
      })
      .afterClosed()
      .subscribe(async () => {
        this.results = await this.resultsService.getAllResults();
      });
  }

  /**
   * Export all completed Exam Results to tablet's local storage.
   * @summary Write each result to android, update disk.uploadSummary,
   * then delete the result from the completed exams and the sqlite database.
   * @models disk
   */
  async exportAll() {
    try {
      if (!_.isUndefined(this.results)) {
        this.results.forEach(async (examResult: ExamResults) => {
          await this.resultsService.writeResultToFile(examResult);
        });
        await this.deleteAll(false);
      }
    } catch (e) {
      this.logger.error('Failed to export all results to file with error: ' + _(e).toJSON);
    }
  }

  // async upload() {

  // }

  /**
   * Delete all exam results from the disk completed exam results and from the sqlite database.
   */
  async deleteAll(showPopup = true) {
    // deleteAll defaults to presenting a popup confirm, can be ignored by setting to false.
    if (showPopup === true) {
      const msg: DialogDataInterface = {
        title: 'Confirm',
        content: 'Are you sure you want to delete all of the results?',
        type: DialogType.Confirm,
      };
      this.notifications.alert(msg).subscribe(async result => {
        if (result === 'OK') {
          await this.sqLite.deleteAll('results');
          this.results = await this.resultsService.getAllResults();
        }
      });
    } else {
      await this.sqLite.deleteAll('results');
      this.results = await this.resultsService.getAllResults();
    }
  }

  async bulkUpload() {
    const uploadResults: { success: { result: ExamResults; message: string }[]; failed: { result: ExamResults; message: string }[] } = {
      success: [],
      failed: [],
    };

    if (!this.results || this.results.length === 0) {
      this.notifications.alert({
        title: 'Upload',
        content: 'No results available for upload.',
        type: DialogType.Alert,
      });
      return;
    }

    for (const result of this.results) {
      const uploadResult = await this.resultsUploadService.uploadResult(result);
      if (uploadResult.success) {
        uploadResults.success.push({ result, message: uploadResult.message });
      } else {
        uploadResults.failed.push({ result, message: uploadResult.message });
      }
    }

    if (uploadResults.success.length > 0) {
      const successIndexes = uploadResults.success.map(s => this.results!.indexOf(s.result)).filter(index => index !== -1);

      successIndexes.sort((a, b) => b - a);

      for (const index of successIndexes) {
        await this.sqLite.deleteSingleResult(index);
      }

      this.results = await this.resultsService.getAllResults();
    }

    const successMessage = uploadResults.success.map(s => `✔️ ${s.result.protocol.name || 'Unknown Protocol'}: ${s.message}`).join('<br>');

    const failureMessage = uploadResults.failed.map(f => `❌ ${f.result.protocol.name || 'Unknown Protocol'}: ${f.message}`).join('<br>');

    this.notifications.alert({
      title: 'Upload Summary',
      content: `Successfully uploaded: ${uploadResults.success.length} results.<br>${successMessage}<br>
                  Failed to upload: ${uploadResults.failed.length} results.<br>${failureMessage}`,
      type: DialogType.Confirm,
    });
  }
}
