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
import { GapExamPropertiesInterface, GapPlotDataInterface, GapResponseAreaInterface, GapResultsInterface } from './gap.interface';

const EXAM_NAME = 'GAP';

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

  @ViewChild('gapCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  // Configuration
  private readonly allowableDevices = [DeviceType.Wahts];
  private readonly defaultTrainingGapLengths = [40, 20, 12, 6, 0];
  gapTraining = false;
  gapLengths: number[] = this.defaultTrainingGapLengths;
  autoSubmit = false;
  useSoftwareButton = false;
  buttonText = 'Press when gap detected';

  // State
  gapState: 'start' | 'exam' | 'results' = 'start';
  noiseLevel = 65;
  buttonPressed = false;
  device: IDevice | undefined;
  gapResultsData: GapPlotDataInterface | undefined;
  showResults = false;

  private responseArea: GapResponseAreaInterface | undefined;
  private examProperties: GapExamPropertiesInterface = {};
  private initialized = false;
  private examActive = false;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;

  // Training canvas animation state
  private readonly animationSpeed = 30; // ms refresh of the training animation
  private readonly tickWidth = 2; // px width of the moving sound tick mark
  private animationInterval: ReturnType<typeof setInterval> | undefined;
  private timePres = 0;
  private animX = 0;
  private gapPos = 0;
  private gapWidth = 0;
  private windowPos = 0;
  private windowWidth = 0;
  private windowPosEnd = 0;
  private hitOrMiss: boolean | undefined;

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
    this.responseArea = responseArea;
    this.gapTraining = responseArea.training ?? gapSchema.properties.training.default;
    this.autoSubmit = responseArea.autoSubmit ?? gapSchema.properties.autoSubmit.default;
    this.gapLengths =
      responseArea.trainingAllowableGapLengths?.length === 5 ? responseArea.trainingAllowableGapLengths : this.defaultTrainingGapLengths;
    this.examProperties = responseArea.examProperties ?? {};
    this.useSoftwareButton = Boolean(this.examProperties.UseSoftwareButton ?? false);

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
    this.startPollingResults(results => this.finishFullExam(results));
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
    try {
      if (!this.device) {
        await this.devicesService.deviceNotFound();
        return;
      }
    } catch (e) {
      this.logger.error('startTrainingTrial failed: ' + JSON.stringify(e));
      throw e;
    }
    const props: GapExamPropertiesInterface = {
      Channel: this.examProperties.Channel ?? 0,
      TimePres: this.examProperties.TimePres ?? 4000,
      TimeLead: this.examProperties.TimeLead ?? 1000,
      TimeTrail: this.examProperties.TimeTrail ?? 1000,
      TimeWindow: this.examProperties.TimeWindow ?? 900,
      TimeNoResp: this.examProperties.TimeNoResp ?? 50,
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
    this.useSoftwareButton = true;
    this.resetCanvas();
    this.gapState = 'exam';
    this.stateModel.updateState({ isSubmittable: false });

    this.logger.debug(`Gap exam: training trial. device status=${this.device.status}, props=${JSON.stringify(props)}`);
    const abortResp = await this.devicesService.abortExams(this.device);
    this.logger.debug('Gap exam: abortExams response: ' + JSON.stringify(abortResp?.msg));
    const queueResp = await this.devicesService.queueExam(this.device, EXAM_NAME, props);
    this.logger.debug('Gap exam: queueExam response: ' + JSON.stringify(queueResp?.msg));
    this.examActive = true;
    this.examActive = true;

    // Read the in-progress results to position the training animation.
    const initial = await this.requestGapResults();
    if (initial) {
      this.initializeGapTraining(initial, props);
    }

    // Poll until the device finishes the single presentation to capture hit/miss.
    this.startPollingResults(results => this.finishTrainingTrial(results));
  }

  /**
   * Complete a training trial, returning the UI to the training selection screen.
   * @param results The final results returned by the device.
   */
  private finishTrainingTrial(results: GapResultsInterface): void {
    if (results.HitOrMiss !== undefined) {
      this.hitOrMiss = results.HitOrMiss;
    } else if (results.HitOrMissArray && results.HitOrMissArray.length > 0) {
      this.hitOrMiss = results.HitOrMissArray[results.HitOrMissArray.length - 1];
    }
    // The exam ends after the response window has passed, so the animation has usually
    // already stopped. Redraw a final frame so the window shows the hit (green) / miss (red).
    this.stopAnimation();
    this.drawGapFrame();
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
    this.animX = (playPos * canvas.width) / timePres;
    this.gapPos = ((results.CurrentGapStartTime ?? 0) * canvas.width) / timePres;
    this.gapWidth = (gapLength * canvas.width) / timePres;
    this.windowPos = this.gapPos + ((gapLength + (props.TimeNoResp ?? 0)) * canvas.width) / timePres;
    this.windowWidth = ((props.TimeWindow ?? 0) * canvas.width) / timePres;
    this.windowPosEnd = this.windowPos + this.windowWidth;

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
    this.drawGapFrame();
    this.animX += (this.animationSpeed * canvas.width) / this.timePres;
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
   * Poll the device for results every 500ms, invoking onComplete once the exam is done.
   * @param onComplete Callback invoked with the final results when the exam completes.
   */
  private startPollingResults(onComplete: (results: GapResultsInterface) => void): void {
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
   * @returns The gap results, or undefined if the response was not usable.
   */
  private async requestGapResults(): Promise<GapResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device);
    if (resp?.msg && typeof resp.msg[1] === 'object' && resp.msg[1] !== null) {
      return resp.msg[1] as GapResultsInterface;
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
   * Build the data structure consumed by the gap results plot.
   * @param results The final results returned by the device.
   */
  private createGapData(results: GapResultsInterface): GapPlotDataInterface {
    const gapLengths = results.GapLengthArray ?? [];
    const maxLength = gapLengths.reduce((max, value) => (value > max ? value : max), 0);
    return {
      y: gapLengths,
      hit: results.HitOrMissArray ?? [],
      maxY: maxLength === 0 ? 200 : maxLength + 10,
      GapThreshold: results.GapThreshold && !Number.isNaN(results.GapThreshold) ? results.GapThreshold : 0,
      reversals: results.ReversalUsedForThresholdArray ?? [],
      xLabel: 'Presentation #',
      yLabel: 'Gap Length (ms)',
      title: 'Gap Detection Results',
    };
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
