import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { MrtResultsInterface } from '../mrt-exam/mrt-exam.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-mrt-results',
  templateUrl: './mrt-results.component.html',
  styleUrl: './mrt-results.component.css',
})
export class MrtResultsComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);

  @Input() mrtResults!: MrtResultsInterface[];
  state: StateInterface;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.stateModel.updateState({ isSubmittable: true });
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  sortMrtResults() {
    return this.mrtResults.sort((a, b) => b.snr - a.snr);
  }
}
