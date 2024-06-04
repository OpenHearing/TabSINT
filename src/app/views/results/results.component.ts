import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ResultsService } from '../../controllers/results.service';

import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results-model.service';

import { SqLite } from '../../utilities/sqLite.service';

import { SingleResultModalComponent } from '../single-result-modal/single-result-modal/single-result-modal.component';

@Component({
  selector: 'results-view',
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {
  disk: DiskInterface;
  state: StateInterface;
  index: number = 0;
  results: ResultsInterface;

  constructor (
    public diskModel: DiskModel,
    public stateModel: StateModel,
    public resultsService: ResultsService,
    public sqLite: SqLite,
    public resultsModel: ResultsModel,
    public dialog: MatDialog
  ){
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.results = this.resultsModel.getResults();
  }


  trackByIndex(index: number, item: any): number {
    return index;
  }

  viewResult(index: number) {
    this.dialog.open(SingleResultModalComponent, {
      data: index
    }).afterClosed().subscribe();
  }
}
