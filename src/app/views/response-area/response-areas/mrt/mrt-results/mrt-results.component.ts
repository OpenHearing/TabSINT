import { Component, Input } from '@angular/core';
import { MrtResultsInterface } from '../mrt-exam/mrt-exam.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';

@Component({
  selector: 'mrt-results',
  templateUrl: './mrt-results.component.html',
  styleUrl: './mrt-results.component.css'
})
export class MrtResultsComponent {
  @Input() mrtResults!: MrtResultsInterface[];
  state: StateInterface;

  constructor(
    private readonly stateModel: StateModel
  ) {
    this.state = this.stateModel.getState();
    this.state.isSubmittable = true;
  }

  sortMrtResults() {
    return this.mrtResults.sort((a, b) => b.snr - a.snr);
  }
}
