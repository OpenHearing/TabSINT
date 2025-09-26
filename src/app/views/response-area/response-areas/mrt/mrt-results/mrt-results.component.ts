import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MrtResultsInterface } from '../mrt-exam/mrt-exam.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'mrt-results',
  templateUrl: './mrt-results.component.html',
  styleUrl: './mrt-results.component.css'
})
export class MrtResultsComponent implements OnInit, OnDestroy {
  @Input() mrtResults!: MrtResultsInterface[];
  state: StateInterface;
  stateSubscription: Subscription | undefined;

  constructor(
    private readonly stateModel: StateModel
  ) {
    this.state = this.stateModel.getState();
    this.stateModel.updateState({isSubmittable: true});
  }

  ngOnInit() {
    this.stateSubscription = this.stateModel.stateSubject.subscribe( (updatedState) => {
      this.state = updatedState;
    });
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  sortMrtResults() {
    return this.mrtResults.sort((a, b) => b.snr - a.snr);
  }
}
