import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../../models/disk/disk.interface';
import { ExamResults } from '../../../models/results/results.interface';
import { DiskModel } from '../../../models/disk/disk.service';
import { ResultsService } from '../../../controllers/results.service';
import { Notifications } from '../../../services/notifications.service';
import { Logger } from '../../../services/logger.service';
import { DialogType } from '../../../utilities/constants';
import { ResultsUploadService } from '../../../controllers/results-upload.service';
import { DialogDataInterface } from '../../../interfaces/dialog-data.interface';

@Component({
  selector: 'app-single-result-modal',
  templateUrl: './single-result-modal.component.html',
  styleUrl: './single-result-modal.component.css',
})
export class SingleResultModalComponent implements OnInit, OnDestroy {
  readonly dialog = inject(MatDialog);
  readonly diskModel = inject(DiskModel);
  readonly resultsService = inject(ResultsService);
  private readonly resultsUploadService = inject(ResultsUploadService);
  private readonly notifications = inject(Notifications);
  private readonly logger = inject(Logger);
  readonly index = inject<number>(MAT_DIALOG_DATA);

  singleExamResult?: ExamResults;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.asyncNgOnInit();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnIit to handle any asynchronous operations.
   */
  private async asyncNgOnInit(): Promise<void> {
    this.singleExamResult = (await this.resultsService.getSingleResult(this.index)) ?? undefined;
  }

  async upload() {
    const result = await this.resultsUploadService.uploadResult(this.singleExamResult!);

    if (result.success) {
      this.delete();
      this.notifications.alert({
        title: 'Success',
        content: result.message || 'Result uploaded to GitLab.',
        type: DialogType.Confirm,
      });
    } else {
      if (result.message.includes('Unauthorized')) {
        this.notifications.alert({
          title: 'Unauthorized',
          content: 'Check your GitLab credentials.',
          type: DialogType.Alert,
        });
      } else {
        this.notifications.alert({
          title: 'Upload Error',
          content: result.message || 'Something went wrong uploading the result.',
          type: DialogType.Alert,
        });
      }
      this.logger.error('Error uploading to Gitlab: ' + result.message);
    }
  }

  /**
   * Exports single exam result to the tablet file system.
   */
  async export() {
    await this.resultsService.exportSingleResult(this.index);
    this.close();
  }

  /**
   * Prompt for confirmation, then delete single exam result from tabsint.
   */
  confirmDelete() {
    const msg: DialogDataInterface = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this result?',
      type: DialogType.Confirm,
    };
    this.notifications.alert(msg).subscribe(result => {
      if (result === 'OK') {
        this.delete();
      }
    });
  }

  /**
   * Delete single exam result from tabsint.
   */
  delete() {
    this.resultsService.deleteSingleResult(this.index);
    this.close();
  }

  /**
   * Close SingleResultModal view
   * @summary Close MatDialog.
   */
  close() {
    this.dialog.closeAll();
  }
}
