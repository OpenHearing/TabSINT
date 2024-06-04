import { Component, Inject } from '@angular/core';

import { DiskModel } from '../../../models/disk/disk.service';
import { DiskInterface } from '../../../models/disk/disk.interface';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ExamResults } from '../../../models/results/results.interface';
import { ResultsService } from '../../../controllers/results.service';

@Component({
  selector: 'app-single-result-modal',
  templateUrl: './single-result-modal.component.html',
  styleUrl: './single-result-modal.component.css'
})
export class SingleResultModalComponent {
  disk: DiskInterface;
  singleExamResult : ExamResults;

  constructor(
    public dialog: MatDialog, 
    public diskModel: DiskModel,
    public resultsService: ResultsService,
    @Inject(MAT_DIALOG_DATA) public index: number,
  ) {
    this.disk = this.diskModel.getDisk();
    this.singleExamResult = this.disk.completedExamsResults[index];
  }

  upload() {
    console.log("SingleResultModalComponent.upload() called. Not implemented.");
    this.close();
  }

  export() {
    this.resultsService.exportSingleResult(this.index);
    this.close();
  }

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
