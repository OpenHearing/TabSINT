import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { Logger } from '../../utilities/logger.service';
import { ExamState } from '../../utilities/constants';

@Component({
  selector: 'exam-device-error-view',
  templateUrl: './exam-device-error.component.html',
  styleUrl: './exam-device-error.component.css'
})

export class ExamDeviceErrorComponent {
  state: StateInterface;
  deviceErrors: Array<any> = [];

  constructor(
    private readonly stateModel: StateModel,
    private readonly logger: Logger,
  ) {
    this.state = this.stateModel.getState();
    this.state.deviceError?.slice(2).forEach((err: string|number) => {
      if (typeof err === "string") {
        this.deviceErrors.push(err);
      } 
    });
    
  }

  retry() {
    console.log("retry button pressed, setting state to TESTING and clearing deviceError(s)");
    this.state.examState = ExamState.Testing;
    this.state.deviceError = [];
  }

}
