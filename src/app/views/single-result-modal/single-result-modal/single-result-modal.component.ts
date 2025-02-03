import { Component, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../../models/disk/disk.interface';
import { ExamResults } from '../../../models/results/results.interface';
import { DiskModel } from '../../../models/disk/disk.service';
import { ResultsService } from '../../../controllers/results.service';
import { SqLite } from '../../../utilities/sqLite.service';
import { Notifications } from '../../../utilities/notifications.service';
import { Logger } from '../../../utilities/logger.service';
import { DialogType} from '../../../utilities/constants';
import { ResultsUploadService } from '../../../controllers/results-upload.service';

@Component({
  selector: 'app-single-result-modal',
  templateUrl: './single-result-modal.component.html',
  styleUrl: './single-result-modal.component.css'
})
export class SingleResultModalComponent {
  singleExamResult?: ExamResults;
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  constructor(
    public dialog: MatDialog, 
    public diskModel: DiskModel,
    public resultsService: ResultsService,
    public sqLite: SqLite,
    private readonly resultsUploadService: ResultsUploadService,
    private readonly notifications: Notifications,
    private readonly logger: Logger,
    @Inject(MAT_DIALOG_DATA) public index: number,
  ) { 
    this.disk = diskModel.getDisk();
  }

  async ngOnInit() {    
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.singleExamResult = JSON.parse(await this.sqLite.getSingleResult(this.index));
  }

  ngOnDestroy() {
    this.diskSubscription?.unsubscribe();
  }

  async upload() {
    const result = await this.resultsUploadService.uploadResult(this.singleExamResult!);

    if (result.success) {
      this.logger.debug(result.message);
      this.delete();
      this.notifications.alert({
        title: "Success",
        content: result.message || "Result uploaded to GitLab.",
        type: DialogType.Confirm
      });
    } else {
        if (result.message.includes("Unauthorized")) {
          this.notifications.alert({
              title: "Unauthorized",
              content: "Check your GitLab credentials.",
              type: DialogType.Alert
          });
      } else {
          this.notifications.alert({
              title: "Upload Error",
              content: result.message || "Something went wrong uploading the result.",
              type: DialogType.Alert
          });
      }
      this.logger.error(result.message);
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
