import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { DevicesService } from '../../../../../services/devices/devices.service';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { WAIResultsInterface } from '../wai-exam/wai-exam.interface';
import { Logger } from '../../../../../services/logger.service';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { IDeviceResponse } from '../../../../../interfaces/devices/device-response.interface';

@Component({
  selector: 'app-wai-in-progress',
  templateUrl: './wai-in-progress.component.html',
  styleUrl: './wai-in-progress.component.css',
})
export class WAIInProgressComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);
  private readonly stateModel = inject(StateModel);

  @Input() device: IDevice | undefined;
  @Input() parameterMap!: Map<string, string>;
  @Output() WAIResultsEvent = new EventEmitter<WAIResultsInterface>();

  state: StateInterface;
  inProgressResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0,
  };
  inProgressResultsSubject = new BehaviorSubject<WAIResultsInterface>(this.inProgressResults);
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  instructions: string = 'Exam in progress please wait.';

  inProgressResultsSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
    this.stateModel.updateState({ isSubmittable: false });
  }

  ngOnInit(): void {
    this.requestResults();
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: WAIResultsInterface) => {
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngOnDestroy(): void {
    this.stateModel.updateState({ isSubmittable: true });
    this.shouldAbort = true;
    this.inProgressResultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  async abort() {
    this.shouldAbort = true;
    this.updateInstructionsAfterAbortButtonPressed();
    await this.waitForRequestResultsDone();
    await this.devicesService.abortExams(this.device!);
    this.updateInstructionsAfterAbortComplete();
    this.updateStateOnAbort();
    this.WAIResultsEvent.emit(this.inProgressResults);
  }

  private async requestResults() {
    const pollResults = async () => {
      if (this.shouldAbort) return;

      this.isRequestingResults = true;
      const resp = await this.devicesService.requestResults(this.device!);
      this.isRequestingResults = false;

      if (this.shouldAbort) return;

      if (this.doesRespContainResults(resp)) {
        this.inProgressResultsSubject.next(resp?.msg[1] as WAIResultsInterface);
        if (this.inProgressResults.State === 'DONE') {
          this.stateModel.updateState({ isSubmittable: true });
          this.WAIResultsEvent.emit(resp?.msg[1] as WAIResultsInterface);
          this.instructions = "Exam complete, press 'Next' to continue.";
          this.changeDetectorRef.detectChanges();
          return;
        }
      } else {
        this.logger.debug('WAI in-progress component. Request results did not return expected results. It may be too early to receive results.');
      }

      setTimeout(pollResults, 1000);
    };

    pollResults();
  }

  private doesRespContainResults(resp: IDeviceResponse | undefined) {
    return (
      resp?.msg !== undefined &&
      resp.msg.length > 1 &&
      resp.msg[1] !== 'ERROR' &&
      resp.msg[2] !== 'timeout' &&
      resp.msg[2] !== 'byte timeout' &&
      resp.msg[1] !== 'OK'
    );
  }

  private async waitForRequestResultsDone() {
    while (this.isRequestingResults) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private updateInstructionsAfterAbortButtonPressed() {
    this.instructions =
      'Abort pressed, please wait while exam is aborted. This may take several minutes, but the data collected so far will be saved.';
    this.changeDetectorRef.detectChanges();
  }

  private updateInstructionsAfterAbortComplete() {
    this.instructions = "Exam aborted, press 'Next' to continue.";
    this.changeDetectorRef.detectChanges();
  }

  private updateStateOnAbort() {
    this.stateModel.updateState({ isSubmittable: true });
    this.inProgressResults.State = 'ABORTED';
    this.shouldAbort = false;
  }
}
