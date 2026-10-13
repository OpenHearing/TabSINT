import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { Logger } from '../../services/logger.service';
import { ExamState } from '../../utilities/constants';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-exam-device-error-view',
  templateUrl: './exam-device-error.component.html',
  styleUrl: '../../../styles.scss',
})
export class ExamDeviceErrorComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);
  private readonly logger = inject(Logger);

  state: StateInterface;
  deviceErrors: any[] = [];
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.state.deviceError?.slice(2).forEach((err: string | number) => {
      if (typeof err === 'string') {
        this.deviceErrors.push(err);
      }
    });
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  retry() {
    this.logger.debug('retry button pressed, setting state to TESTING and clearing deviceError(s)');
    this.stateModel.updateState({
      examState: ExamState.Testing,
      deviceError: [],
    });
  }
}
