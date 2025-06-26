import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { DevicesService } from '../../../../../controllers/devices.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { WAIResultsInterface } from '../wai-exam/wai-exam.interface';
import { Logger } from '../../../../../utilities/logger.service';

@Component({
  selector: 'wai-in-progress',
  templateUrl: './wai-in-progress.component.html',
  styleUrl: './wai-in-progress.component.css'
})
export class WAIInProgressComponent implements OnInit, OnDestroy {
  @Input() device: ConnectedDevice | undefined;
  @Input() fStart!: number;
  @Input() fEnd!: number;
  @Input() sweepDuration!: number;
  @Input() sweepType!: string;
  @Input() level!: number;
  @Input() numSweeps!: number;
  @Input() windowDuration!: number;
  @Input() numFrequencies!: number;
  @Input() filename!: string;
  @Input() outputRawMeasurements!: boolean;
  @Input() outputChannel!: string;
  @Input() inputChannels!: Array<string>;
  @Input() aurenInsideDiameter!: number;
  @Input() aurenLength!: number;
  @Input() earCanalDiameter!: number;
  @Input() earCanalLength!: number;
  @Output() WAIResultsEvent = new EventEmitter<WAIResultsInterface>();

  state: StateInterface;
  inProgressResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  inProgressResultsSubject = new BehaviorSubject<WAIResultsInterface>(this.inProgressResults);
  inProgressResultsSubscription: Subscription | undefined;
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  instructions: string = "Exam in progress please wait.";

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly devicesService: DevicesService,
    private readonly logger: Logger, 
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.state.isSubmittable = false;
  }

  async ngOnInit(): Promise<void> {
    this.requestResults();
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: WAIResultsInterface) => {
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngOnDestroy(): void {
    this.state.isSubmittable = true;
  }

  async abort() {
    this.waitForRequestResultsDone();
    this.updateInstructions();
    await this.devicesService.abortExams(this.device!);
    this.updateStateOnAbort();
    this.WAIResultsEvent.emit(this.inProgressResults);
  }

  private async requestResults() {
    const pollResults = async () => {
      if (this.shouldAbort) return;
  
      this.isRequestingResults = true;  
      let resp = await this.devicesService.requestResults(this.device!, 300000);
      this.isRequestingResults = false;
  
      if (this.shouldAbort) return;
  
      if (this.doesRespContainResults(resp)) {
        this.inProgressResultsSubject.next(resp![1]);
        if (this.inProgressResults.State === 'DONE') {
          this.state.isSubmittable = true;
          this.WAIResultsEvent.emit(resp![1]);
          this.instructions = "Exam complete, press 'Next' to continue."
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

  private doesRespContainResults(resp: any[] | undefined) {
    return resp !== undefined && 
           resp.length > 1 && 
           resp[1] !== 'ERROR' && 
           resp[2] !== 'timeout' &&
           resp[1] !== 'OK';
  }
  
  private async waitForRequestResultsDone() {
    this.shouldAbort = true;
    while (this.isRequestingResults) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }  
  }

  private updateInstructions() {
    this.instructions = "Exam aborted, press 'Next' to continue.";
    this.changeDetectorRef.detectChanges();
  }

  private updateStateOnAbort() {
    this.state.isSubmittable = true;
    this.inProgressResults.State = 'ABORTED';
  }

}
