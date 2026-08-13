import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageModel } from '../../../../models/page/page.service';
import { StateModel } from '../../../../models/state/state.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ExamService } from '../../../../controllers/exam.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceType } from '../../../../utilities/constants';
import { gapSchema } from '../../../../../schema/response-areas/gap.schema';
import { GapExamPropertiesInterface, GapResponseAreaInterface, GapResultsInterface } from './gap.interface';
import { isGapResults, isStatusResponse } from '../../../../guards/type.guard';
import { TrialProgressionPlotDataInterface } from '../shared/trial-progression-plot/trial-progression-plot.interface';

const EXAM_NAME = 'GAP';

/** CHA device exam states reported by requestStatus (mirrors the legacy status.state values). */
enum ChaExamState {
  Ready = 1,
  Playing = 2,
}

@Component({
  selector: 'app-gap-exam',
  templateUrl: './gap.component.html',
  styleUrl: './gap.component.css',
})
export class GapComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);

  @ViewChild('gapCanvas') private readonly canvasRef?: ElementRef<HTMLCanvasElement>;

  // Configuration
  private readonly allowableDevices = [DeviceType.Wahts];
  private readonly defaultTrainingGapLengths = gapSchema.properties.trainingAllowableGapLengths.default;
  gapTraining = gapSchema.properties.training.default;
  gapLengths: number[] = this.defaultTrainingGapLengths;
  autoSubmit = gapSchema.properties.autoSubmit.default;
  useSoftwareButton = Boolean(gapSchema.properties.examProperties.properties.UseSoftwareButton.default);
  buttonText = 'Press when gap detected';
  examInstructions = "Select a gap length to run a training trial, then press 'Begin Exam' to run the full test.";

  // State
  gapState: 'start' | 'exam' | 'results' = 'start';
  noiseLevel = gapSchema.properties.examProperties.properties.LNoise.default;
  buttonPressed = false;
  device: IDevice | undefined;
  gapResultsData: TrialProgressionPlotDataInterface | undefined;
  showResults = false;

  private examProperties: GapExamPropertiesInterface = {};
  private initialized = false;
  private examActive = false;
  private examPlaying = false;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;

  // Training canvas animation state
  private readonly animationSpeed = 30; // ms refresh of the training animation
  private readonly tickWidth = 2; // px width of the moving sound tick mark
  private readonly finalResultsTimeoutMs = 7000; // device can lag streaming full results after the exam
  private animationInterval: ReturnType<typeof setInterval> | undefined;
  private timePres = 0;
  private animX = 0;
  private animStartTime = 0; // wall-clock time (ms) when the play-position anchor was captured
  private basePlayMs = 0; // device play position (ms) at that anchor
  private gapPos = 0;
  private gapWidth = 0;
  private windowPos = 0;
  private windowWidth = 0;
  private hitOrMiss: boolean | undefined;
  private trainingProps: GapExamPropertiesInterface | undefined;
  private animationStarted = false;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'gapResponseArea') {
        this.setupResponseArea(updatedPage.responseArea as GapResponseAreaInterface);
      }
    });
  }

  ngAfterViewInit(): void {
    this.resetCanvas();
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.stopAnimation();
    this.pageSubscription?.unsubscribe();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
  }

  /**
   * Initialize the response area from the protocol definition and, if this is not a
   * training exam, begin the full exam automatically.
   * @param responseArea The gap response area definition.
   */
  private async setupResponseArea(responseArea: GapResponseAreaInterface): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.gapTraining = responseArea.training ?? this.gapTraining;
    this.autoSubmit = responseArea.autoSubmit ?? this.autoSubmit;
    this.gapLengths =
      responseArea.trainingAllowableGapLengths?.length === 5 ? responseArea.trainingAllowableGapLengths : this.defaultTrainingGapLengths;
    this.examProperties = responseArea.examProperties ?? {};
    this.useSoftwareButton = Boolean(this.examProperties.UseSoftwareButton ?? this.useSoftwareButton);
    this.examInstructions = responseArea.examInstructions ?? this.examInstructions;

    await this.setupDevice(responseArea);
    if (!this.device) {
      return;
    }

    if (!this.gapTraining) {
      await this.startFullExam();
    }
  }

  /**
   * Resolve the WAHTS device used to run the exam.
   * @param responseArea The gap response area definition.
   */
  private async setupDevice(responseArea: GapResponseAreaInterface): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error('Gap exam: no WAHTS device available.');
    }
  }

  // ======= Full exam =======

  /**
   * Queue and run the full gap detection exam, polling until the device reports completion.
   */
  async startFullExam(): Promise<void> {
    if (!this.device) {
      await this.devicesService.deviceNotFound();
      return;
    }
    this.gapTraining = false;
    this.useSoftwareButton = Boolean(this.examProperties.UseSoftwareButton ?? false);
    this.resetCanvas();
    this.gapState = 'exam';
    this.stateModel.updateState({ isSubmittable: false });

    await this.devicesService.abortExams(this.device);
    await this.devicesService.queueExam(this.device, EXAM_NAME, this.examProperties);
    this.examActive = true;
    // Poll lightweight status (not results) while the adaptive exam runs, matching the legacy
    // flow; hammering requestResults mid-exam disrupts the device state machine. Fetch the
    // full results once, at the end.
    this.startStatusPolling(() => this.fetchAndFinishFullExam());
  }

  /**
   * Fetch the final results once the exam has completed and move to the results view. The device
   * can lag streaming the full results after the exam ends, so a longer timeout is used here.
   */
  private async fetchAndFinishFullExam(): Promise<void> {
    const results = await this.requestGapResults(this.finalResultsTimeoutMs);
    if (results) {
      this.finishFullExam(results);
    } else {
      this.logger.error('Gap exam: exam completed but no final results were returned.');
      this.finishFullExam({});
    }
  }

  /**
   * Process the final results of a full exam and move to the results view.
   * @param results The final results returned by the device.
   */
  private finishFullExam(results: GapResultsInterface): void {
    this.gapResultsData = this.createGapData(results);
    this.showResults = true;
    this.gapState = 'results';
    this.resultsModel.updateCurrentPage({ response: results });
    this.stateModel.updateState({ isSubmittable: true });
    if (this.autoSubmit) {
      this.examService.submitDefault();
    }
  }

  // ======= Training =======

  /**
   * Run a single training trial for the selected gap length and noise level.
   * @param gapLength The gap length, in msec, to present.
   * @param noiseLevel The presentation level, in dBA.
   */
  async startTrainingTrial(gapLength: number, noiseLevel: number): Promise<void> {
    if (!this.device) {
      await this.devicesService.deviceNotFound();
      return;
    }
    const props: GapExamPropertiesInterface = {
      Channel: this.examProperties.Channel ?? gapSchema.properties.examProperties.properties.Channel.default,
      TimePres: this.examProperties.TimePres ?? gapSchema.properties.examProperties.properties.TimePres.default,
      TimeLead: this.examProperties.TimeLead ?? gapSchema.properties.examProperties.properties.TimeLead.default,
      TimeTrail: this.examProperties.TimeTrail ?? gapSchema.properties.examProperties.properties.TimeTrail.default,
      TimeWindow: this.examProperties.TimeWindow ?? gapSchema.properties.examProperties.properties.TimeWindow.default,
      TimeNoResp: this.examProperties.TimeNoResp ?? gapSchema.properties.examProperties.properties.TimeNoResp.default,
      UseSoftwareButton: 1,
      AllowableGapLengths: [gapLength],
      LNoise: noiseLevel,
      GapLengthStartIndex: 0,
      NReversals: 1,
      NReversalsCalc: 1,
      NLowestReversals: 0,
      NPresMax: 1,
      NHits: 1,
      NMiss: 1,
      SendFullResults: 2,
    };
    this.timePres = props.TimePres!;
    this.trainingProps = props;
    this.animationStarted = false;
    this.useSoftwareButton = true;
    this.resetCanvas();
    this.gapState = 'exam';
    this.stateModel.updateState({ isSubmittable: false });

    await this.devicesService.abortExams(this.device);
    await this.devicesService.queueExam(this.device, EXAM_NAME, props);
    this.examActive = true;

    // Drive the animation and hit/miss from the polling loop. The CHA rejects a
    // requestResults fired immediately after queueExam, so we never poll eagerly.
    this.startPollingResults(
      results => this.handleTrainingProgress(results),
      results => this.finishTrainingTrial(results)
    );
  }

  /**
   * Handle an in-progress training result: start the animation once the device reports a
   * play position, and turn the response window green as soon as the gap is detected.
   * @param results The latest in-progress results from the device.
   */
  private handleTrainingProgress(results: GapResultsInterface): void {
    if (!this.animationStarted && results.PlayPosition !== undefined && this.trainingProps) {
      this.animationStarted = true;
      this.initializeGapTraining(results, this.trainingProps);
    }
    // Green immediately on a hit; a miss is shown red at the end of the trial.
    if (results.HitOrMiss === 1) {
      this.hitOrMiss = true;
    }
  }

  /**
   * Complete a training trial, returning the UI to the training selection screen.
   * @param results The final results returned by the device.
   */
  private finishTrainingTrial(results: GapResultsInterface): void {
    if (results.HitOrMiss !== undefined) {
      this.hitOrMiss = results.HitOrMiss === 1;
    } else if (results.HitOrMissArray && results.HitOrMissArray.length > 0) {
      this.hitOrMiss = results.HitOrMissArray.at(-1);
    }
    // The exam ends after the response window has passed, so the animation has usually
    // already stopped. Redraw a final frame so the window shows the hit (green) / miss (red).
    // This feedback persists until the next trial or "Begin Exam" (both call resetCanvas).
    if (this.animationInterval === undefined) {
      this.ensureFeedbackVisible();
      this.drawGapFrame();
    }
    this.gapState = 'start';
  }

  /**
   * Compute the gap/response-window geometry used to drive the training animation.
   * @param results The in-progress results from the device.
   * @param props The exam properties used for this trial.
   */
  private initializeGapTraining(results: GapResultsInterface, props: GapExamPropertiesInterface): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }
    canvas.height = 80;
    canvas.style.height = '20%';
    canvas.width = canvas.offsetWidth;

    const timePres = props.TimePres ?? 4000;
    const gapLength = props.AllowableGapLengths?.[0] ?? 0;
    const playPos = results.PlayPosition ?? 0;

    this.timePres = timePres;
    this.basePlayMs = playPos;
    this.animStartTime = Date.now();
    this.animX = (playPos * canvas.width) / timePres;
    this.gapPos = ((results.CurrentGapStartTime ?? 0) * canvas.width) / timePres;
    this.gapWidth = (gapLength * canvas.width) / timePres;
    this.windowPos = this.gapPos + ((gapLength + (props.TimeNoResp ?? 0)) * canvas.width) / timePres;
    this.windowWidth = ((props.TimeWindow ?? 0) * canvas.width) / timePres;

    this.stopAnimation();
    this.animationInterval = setInterval(() => this.drawGapAnimation(), this.animationSpeed);
  }

  /**
   * Advance and render one frame of the training animation, stopping at the end of the noise.
   */
  private drawGapAnimation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }
    // Position the tick from real elapsed time rather than fixed per-frame increments, so it
    // stays synced with the sound and does not drift left when setInterval callbacks fire late.
    const playMs = this.basePlayMs + (Date.now() - this.animStartTime);
    this.animX = (playMs * canvas.width) / this.timePres;
    this.drawGapFrame();
    if (this.animX > canvas.width) {
      this.stopAnimation();
    }
  }

  /**
   * Render a single training frame: background noise, the gap, the response window (colored
   * green for a hit and red for a miss once known, grey otherwise), and the playback tick.
   */
  private drawGapFrame(): void {
    const canvas = this.canvasRef?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    ctx.fillStyle = '#ddd'; // background noise
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff'; // gap
    ctx.fillRect(this.gapPos, 0, this.gapWidth, canvas.height);

    if (this.hitOrMiss === true) {
      ctx.fillStyle = '#4cae4c'; // hit
    } else if (this.hitOrMiss === false) {
      ctx.fillStyle = '#d43f3a'; // miss
    } else {
      ctx.fillStyle = '#666'; // response window, no response yet
    }
    ctx.fillRect(this.windowPos, 0, this.windowWidth, canvas.height);

    ctx.fillStyle = '#000'; // current position tick mark
    ctx.fillRect(this.animX, 0, this.tickWidth, canvas.height);
  }

  // ======= Software response button =======

  /**
   * Register a subject response by toggling the device software button.
   */
  async tapSoftwareButton(): Promise<void> {
    if (!this.device || !this.examActive) {
      return;
    }
    this.buttonPressed = true;
    await this.devicesService.setSoftwareButtonState(this.device, 1);
    setTimeout(() => {
      this.buttonPressed = false;
    }, 150);
    setTimeout(async () => {
      if (this.device && this.examActive) {
        await this.devicesService.setSoftwareButtonState(this.device, 0);
      }
    }, 50);
  }

  // ======= Polling / device helpers =======

  /**
   * Poll the device's lightweight status every 500ms and invoke onComplete once the exam has
   * run and returned to the ready state. Used for the full adaptive exam so that requestResults
   * is not issued while the exam is running.
   * @param onComplete Callback invoked once the exam has finished.
   */
  private startStatusPolling(onComplete: () => void): void {
    this.examPlaying = false;
    const poll = async () => {
      if (!this.examActive || !this.device) {
        return;
      }
      try {
        const state = await this.requestGapStatus();
        if (state === ChaExamState.Playing) {
          this.examPlaying = true;
        }
        // Only treat "ready" as done once we have seen the exam actually start playing,
        // otherwise a status poll landing before playback begins would end it immediately.
        if (this.examPlaying && state === ChaExamState.Ready) {
          this.examActive = false;
          onComplete();
          return;
        }
        this.pollTimeout = setTimeout(poll, 500);
      } catch (error) {
        this.logger.error('Gap exam: error polling status: ' + error);
        this.examActive = false;
      }
    };
    this.pollTimeout = setTimeout(poll, 500);
  }

  /**
   * Request the device's exam status and extract its numeric state.
   * @returns The device state, or undefined if the response was not usable.
   */
  private async requestGapStatus(): Promise<number | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestStatus(this.device);
    if (isStatusResponse(resp)) {
      const state = (resp.msg[1] as { state: number }).state;
      this.logger.debug(`Gap exam: requestStatus state=${state}`);
      return state;
    }
    this.logger.debug('Gap exam: unexpected requestStatus response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Poll the device for results every 500ms, reporting in-progress results to onProgress and
   * the final results to onComplete once the exam is done.
   * @param onProgress Callback invoked with each in-progress result.
   * @param onComplete Callback invoked with the final results when the exam completes.
   */
  private startPollingResults(onProgress: (results: GapResultsInterface) => void, onComplete: (results: GapResultsInterface) => void): void {
    const poll = async () => {
      if (!this.examActive || !this.device) {
        return;
      }
      try {
        const results = await this.requestGapResults();
        if (results && this.isExamComplete(results)) {
          this.examActive = false;
          onComplete(results);
        } else {
          if (results) {
            onProgress(results);
          }
          this.pollTimeout = setTimeout(poll, 500);
        }
      } catch (error) {
        this.logger.error('Gap exam: error polling results: ' + error);
        this.examActive = false;
      }
    };
    this.pollTimeout = setTimeout(poll, 500);
  }

  /**
   * Request results from the device and extract the gap results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The gap results, or undefined if the response was not usable.
   */
  private async requestGapResults(timeoutMs?: number): Promise<GapResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isGapResults(resp.msg[1])) {
      const results = resp.msg[1];
      this.logger.debug(`Gap exam: requestResults State=${results.State}, HitOrMiss=${results.HitOrMiss}, PlayPosition=${results.PlayPosition}`);
      return results;
    }
    this.logger.debug('Gap exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Determine whether the device has finished the exam.
   * @param results The most recent results from the device.
   */
  private isExamComplete(results: GapResultsInterface): boolean {
    return results.State !== undefined && results.State !== 'IN PROGRESS';
  }

  /**
   * Abort any running exam on the device and stop polling.
   */
  private stopExam(): void {
    this.examActive = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = undefined;
    }
    if (this.device) {
      this.devicesService.abortExams(this.device);
    }
  }

  // ======= Canvas / plot helpers =======

  /**
   * Build the data structure consumed by the trial-progression plot.
   * @param results The final results returned by the device.
   */
  private createGapData(results: GapResultsInterface): TrialProgressionPlotDataInterface {
    const gapLengths = results.GapLengthArray ?? [];
    const reversals = results.ReversalUsedForThresholdArray ?? [];
    const maxLength = gapLengths.reduce((max, value) => Math.max(value, max), 0);
    const gapThreshold = results.GapThreshold && !Number.isNaN(results.GapThreshold) ? results.GapThreshold : 0;
    return {
      y: gapLengths,
      pointStyles: gapLengths.map((_length, i) => (reversals[i] ? 'highlight' : 'filled')),
      maxY: maxLength === 0 ? 200 : maxLength + 10,
      referenceLine: gapThreshold,
      xLabel: 'Presentation #',
      yLabel: 'Gap Length (ms)',
      title: 'Gap Detection Results',
    };
  }

  /**
   * Guarantee the feedback frame is visible at the end of a trial. If the animation never
   * initialized (e.g. the device never reported a play position), the canvas is still collapsed,
   * so give it a height and a full-width response window to show the hit/miss color.
   */
  private ensureFeedbackVisible(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || canvas.height > 0) {
      return;
    }
    canvas.height = 80;
    canvas.style.height = '20%';
    canvas.width = canvas.offsetWidth;
    this.gapPos = 0;
    this.gapWidth = 0;
    this.windowPos = 0;
    this.windowWidth = canvas.width;
    this.animX = canvas.width;
  }

  /**
   * Hide and clear the training canvas.
   */
  private resetCanvas(): void {
    this.stopAnimation();
    this.hitOrMiss = undefined;
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      canvas.style.height = '0%';
      canvas.height = 0;
    }
  }

  /**
   * Stop the training animation loop.
   */
  private stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }
}
