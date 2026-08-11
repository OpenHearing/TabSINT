import { AfterViewInit, ChangeDetectorRef, Directive, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';

import { DevicesService } from '../../../../../services/devices/devices.service';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { Logger } from '../../../../../services/logger.service';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { IDeviceResponse } from '../../../../../interfaces/devices/device-response.interface';
import { DpoaeResultsCommonInterface } from './dpoae-common.interface';

/**
 * Shared base for the "exam in progress" view of a DPOAE-family response area. Owns the results
 * polling loop, abort handling, and state wiring that is identical across Swept DPOAE and DP-gram;
 * subclasses supply the plot rendering (createProgressPlot) and decide what to do with each
 * incoming results update (onResultsUpdate), since the plotted data shape differs.
 */
@Directive()
export abstract class DpoaeInProgressBaseComponent<TResults extends DpoaeResultsCommonInterface> implements OnInit, OnDestroy, AfterViewInit {
  protected readonly changeDetectorRef = inject(ChangeDetectorRef);
  protected readonly devicesService = inject(DevicesService);
  protected readonly logger = inject(Logger);
  protected readonly stateModel = inject(StateModel);

  @Input() device: IDevice | undefined;
  @Input() yScale!: d3.ScaleLinear<number, number, never>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() xTicks!: number[];
  @Input() margin!: { top: number; right: number; bottom: number; left: number };
  @Output() resultsEvent = new EventEmitter<TResults>();

  state: StateInterface;
  inProgressResults: TResults;
  inProgressResultsSubject: BehaviorSubject<TResults>;
  inProgressResultsSubscription: Subscription | undefined;
  svg!: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  instructions: string = 'Exam in progress please wait.';

  stateSubscription: Subscription | undefined;

  protected abstract readonly examLabel: string;

  protected constructor() {
    this.inProgressResults = { State: 'READY', PctComplete: 0 } as TResults;
    this.inProgressResultsSubject = new BehaviorSubject<TResults>(this.inProgressResults);
    this.state = this.stateModel.getState();
    this.stateModel.updateState({ isSubmittable: false });
  }

  ngOnInit(): void {
    this.subscribeToState();
    this.subscribeToResults();
    this.startPolling();
  }

  protected subscribeToState(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
  }

  protected subscribeToResults(): void {
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: TResults) => {
      this.onResultsUpdate(updatedResults);
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  /**
   * Kicks off however this response area obtains its results. Default behavior (used by Swept
   * DPOAE) is to poll the single exam already queued by the exam component. DP-gram overrides
   * this to run its own multi-frequency loop instead.
   */
  protected startPolling(): void {
    this.requestResults();
  }

  ngAfterViewInit(): void {
    this.svg = this.createProgressPlot(this.yScale);
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
    this.resultsEvent.emit(this.inProgressResults);
  }

  private async requestResults() {
    const pollResults = async () => {
      if (this.shouldAbort) return;

      this.isRequestingResults = true;
      const resp = await this.devicesService.requestResults(this.device!);
      this.isRequestingResults = false;

      if (this.shouldAbort) return;

      if (this.doesRespContainResults(resp)) {
        this.inProgressResultsSubject.next(resp?.msg[1] as TResults);
        if (this.inProgressResults.State === 'DONE') {
          this.stateModel.updateState({ isSubmittable: true });
          this.resultsEvent.emit(resp?.msg[1] as TResults);
          this.instructions = "Exam complete, press 'Next' to continue.";
          this.changeDetectorRef.detectChanges();
          return;
        }
      } else {
        this.logger.debug(
          `${this.examLabel} in-progress component. Request results did not return expected results. It may be too early to receive results.`
        );
      }

      setTimeout(pollResults, 1000);
    };

    pollResults();
  }

  protected doesRespContainResults(resp: IDeviceResponse | undefined) {
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

  protected abstract createProgressPlot(yScale: d3.ScaleLinear<number, number, never>): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  protected abstract onResultsUpdate(results: TResults): void;
}
