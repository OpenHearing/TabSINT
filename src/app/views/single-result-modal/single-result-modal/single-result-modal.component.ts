import { Component, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

import { DiskInterface } from '../../../models/disk/disk.interface';
import { ExamResults } from '../../../models/results/results.interface';

import { DiskModel } from '../../../models/disk/disk.service';
import { ResultsService } from '../../../controllers/results.service';
import { SqLite } from '../../../utilities/sqLite.service';

@Component({
  selector: 'app-single-result-modal',
  templateUrl: './single-result-modal.component.html',
  styleUrl: './single-result-modal.component.css'
})
export class SingleResultModalComponent {
  singleExamResult?: ExamResults;
  disk: DiskInterface;
  diskSubject: Subscription | undefined;

  constructor(
    public dialog: MatDialog, 
    public diskModel: DiskModel,
    public resultsService: ResultsService,
    public sqLite: SqLite,
    @Inject(MAT_DIALOG_DATA) public index: number,
  ) { 
    this.disk = diskModel.getDisk();
  }

  async ngOnInit() {    
    this.diskSubject = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
        this.disk = updatedDisk;
    })    
    this.singleExamResult = JSON.parse(await this.sqLite.getSingleResult(this.index));
  }

  ngOnDestroy() {
    this.diskSubject?.unsubscribe();
  }

  upload() {
    console.log("SingleResultModalComponent.upload() called. Not implemented.");
    this.close();
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
