import { Component } from '@angular/core';
import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { ResultsService } from '../../controllers/results.service';
import { SqLite } from '../../utilities/sqLite.service';

@Component({
  selector: 'results-view',
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent {
  disk: DiskInterface;
  state: StateInterface;
  index: number = 0;

  constructor (
    public diskModel: DiskModel,
    public stateModel: StateModel,
    public resultsService: ResultsService,
    public sqLite: SqLite
  ){
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  viewResult(index: number) {
    console.log("viewResult called with index: " + index);
  }

  exportAndClose() {
    this.resultsService.exportSingleResult(this.index);
    this.close();
  }

  private close() {
    // close result modal
  }
}
