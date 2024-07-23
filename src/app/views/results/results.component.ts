import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ResultsService } from '../../controllers/results.service';

import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ExamResults, ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';

import { SqLite } from '../../utilities/sqLite.service';

import { SingleResultModalComponent } from '../single-result-modal/single-result-modal/single-result-modal.component';
import { Logger } from '../../utilities/logger.service';
import _ from 'lodash';
import { DBSQLiteValues } from '@capacitor-community/sqlite';

@Component({
  selector: 'results-view',
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {
  disk: DiskInterface;
  state: StateInterface;
  index: number = 0;
  results?: ExamResults[];

  constructor (
    public diskModel: DiskModel,
    public stateModel: StateModel,
    public resultsService: ResultsService,
    public sqLite: SqLite,
    public resultsModel: ResultsModel,
    public dialog: MatDialog,
    private logger: Logger
  ){
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  async ngOnInit() {
    this.results = await this.sqLite.getAllResults();
    console.log('RESULTS', this.results);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  viewResult(index: number) {
    this.dialog.open(SingleResultModalComponent, {
      data: index
    }).afterClosed().subscribe(async () => {
      this.results = await this.sqLite.getAllResults();
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
            this.results.forEach((examResult: ExamResults) => {
                this.resultsService.writeResultToFile(examResult);
            });
            await this.deleteAll();
          }
      } catch(e) {
          this.logger.error("Failed to export all results to file with error: " + _(e).toJSON);
      }

  }

  async upload() {

  }

  /**
   * Delete all exam results from the disk completed exam results and from the sqlite database.
   * @models disk
   */
  async deleteAll() {
      await this.sqLite.deleteAll('results');      
      this.results = await this.sqLite.getAllResults();
  }

}
