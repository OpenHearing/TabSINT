import { Component, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../services/device-utility.service';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { SweptDpoaeInterface, SweptDpoaeResultsInterface } from './swept-dpoae-exam.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { sweptDpoaeSchema } from '../../../../../../schema/response-areas/swept-dpoae.schema';
import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { handleOutputCalibration } from '../../../../../utilities/exam-helper-functions';

@Component({
  selector: 'swept-dpoae-exam',
  templateUrl: './swept-dpoae-exam.component.html',
  styleUrl: './swept-dpoae-exam.component.css',
})
export class SweptDpoaeExamComponent implements OnInit, OnDestroy {
  tabsintId: string = sweptDpoaeSchema.properties.tabsintId.default;
  outputCalibrationType: string = sweptDpoaeSchema.properties.outputCalibrationType.default;
  outputChannel1: string = sweptDpoaeSchema.properties.outputChannel1.default;
  outputChannel2: string = sweptDpoaeSchema.properties.outputChannel2.default;
  inputChannel: string = sweptDpoaeSchema.properties.inputChannel.default;
  f2Start: number = sweptDpoaeSchema.properties.f2Start.default;
  f2End: number = sweptDpoaeSchema.properties.f2End.default;
  ratio: number = sweptDpoaeSchema.properties.ratio.default;
  sweepDuration: number = sweptDpoaeSchema.properties.sweepDuration.default;
  sweepType: 'log' | 'linear' = sweptDpoaeSchema.properties.sweepType.default;
  l1: number = sweptDpoaeSchema.properties.l1.default;
  l2: number = sweptDpoaeSchema.properties.l2.default;
  minSweeps: number = sweptDpoaeSchema.properties.minSweeps.default;
  maxSweeps: number = sweptDpoaeSchema.properties.maxSweeps.default;
  noiseFloorThreshold: number = sweptDpoaeSchema.properties.noiseFloorThreshold.default;
  SNRThreshold: number = sweptDpoaeSchema.properties.SNRThreshold.default;
  windowDuration: number = sweptDpoaeSchema.properties.windowDuration.default;
  numFrequencies: number = sweptDpoaeSchema.properties.numFrequencies.default;
  filename: string = sweptDpoaeSchema.properties.filename.default;
  outputRawMeasurements: boolean = sweptDpoaeSchema.properties.outputRawMeasurements.default;
  normativeDataPath: string = sweptDpoaeSchema.properties.normativeDataPath.default;
  normativeData: NormativeDataInterface[] = sweptDpoaeSchema.properties.normativeData.default;
  results: ResultsInterface;
  showResults: boolean = sweptDpoaeSchema.properties.showResults.default;
  pageSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  currentStep: string = 'input-parameters';
  device: ConnectedDevice | undefined;
  sweptDPOAEResults: SweptDpoaeResultsInterface = {
    State: 'READY',
    PctComplete: 0,
  };
  inputParameterMap: Map<string, string> = new Map(); // Parameter map to display the user input parameters

  // Set default dimensions and margins
  margin = { top: 20, right: 30, bottom: 60, left: 70 };
  width = 450 - this.margin.left - this.margin.right;
  height = 300 - this.margin.top - this.margin.bottom;
  xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  xScale = d3.scaleLog();
  yScale = d3.scaleLinear();

  constructor(
    private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil,
    private readonly logger: Logger,
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService,
    private readonly buttonTextService: ButtonTextService
  ) {
    this.results = this.resultsModel.getResults();
    this.examService.submit = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.nextStep();
    };
    this.examService.reset = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.examService.resetDefault();
    };
    this.examService.submitPartial = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.examService.submitPartialDefault();
    };
    this.examService.navigateToTarget = subProtocolId => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.examService.navigateToTargetDefault(subProtocolId);
    };
  }

  ngOnInit(): void {
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'sweptDPOAEResponseArea') {
        const responseArea = updatedPage.responseArea as SweptDpoaeInterface;
        this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
        this.outputCalibrationType = responseArea.outputCalibrationType ?? this.outputCalibrationType;
        this.outputChannel1 = responseArea.outputChannel1 ?? this.outputChannel1;
        this.outputChannel2 = responseArea.outputChannel2 ?? this.outputChannel2;
        this.inputChannel = responseArea.inputChannel ?? this.inputChannel;
        this.f2Start = responseArea.f2Start ?? this.f2Start;
        this.f2End = responseArea.f2End ?? this.f2End;
        this.ratio = responseArea.ratio ?? this.ratio;
        this.sweepDuration = responseArea.sweepDuration ?? this.sweepDuration;
        this.sweepType = responseArea.sweepType ?? this.sweepType;
        this.l1 = responseArea.l1 ?? this.l1;
        this.l2 = responseArea.l2 ?? this.l2;
        this.minSweeps = responseArea.minSweeps ?? this.minSweeps;
        this.maxSweeps = responseArea.maxSweeps ?? this.maxSweeps;
        this.noiseFloorThreshold = responseArea.noiseFloorThreshold ?? this.noiseFloorThreshold;
        this.SNRThreshold = responseArea.SNRThreshold ?? this.SNRThreshold;
        this.windowDuration = responseArea.windowDuration ?? this.windowDuration;
        this.numFrequencies = responseArea.numFrequencies ?? this.numFrequencies;
        this.filename = responseArea.filename ?? this.filename;
        this.outputRawMeasurements = responseArea.outputRawMeasurements ?? this.outputRawMeasurements;
        this.normativeDataPath = responseArea.normativeDataPath ?? this.normativeDataPath;
        this.normativeData = responseArea.normativeData ?? this.normativeData;

        this.inputParameterMap = new Map([
          ['Start Frequency [Hz]', this.f2Start.toString()],
          ['End Frequency [Hz]', this.f2End.toString()],
          ['Ratio', this.ratio.toString()],
          ['Sweep Duration [s]', this.sweepDuration.toString()],
          ['Window Duration [s]', this.windowDuration.toString()],
          ['Sweep Type', this.sweepType.toString()],
          ['Minimum Num Sweeps', this.minSweeps.toString()],
          ['Maximum Num Sweeps', this.maxSweeps.toString()],
          ['Noise Floor Threshold', this.noiseFloorThreshold.toString()],
        ]);

        // Update xTicks and scales
        this.xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000].filter(tick => tick >= this.f2Start && tick <= this.f2End);
        this.xScale = d3.scaleLog().domain([this.f2Start, this.f2End]).range([0, this.width]);

        this.yScale = d3.scaleLinear().domain([-20, 70]).range([this.height, 0]);
      }
    });
  }

  ngOnDestroy(): void {
    this.asyncNgOnDestroy();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText('Submit');
  }

  /**
   * Function to be called by ngOnDestroy to handle any asynchronous operations.
   */
  private async asyncNgOnDestroy(): Promise<void> {
    await this.devicesService.abortExams(this.device!);
  }

  async nextStep(): Promise<void> {
    switch (this.currentStep) {
      case 'input-parameters':
        await this.beginExam();
        this.currentStep = 'in-progress';
        this.buttonTextService.updateButtonText('Next');
        break;
      case 'in-progress':
        this.currentStep = 'results';
        this.buttonTextService.updateButtonText('Finish');
        break;
      case 'results':
        this.examService.submitDefault();
        break;
    }
  }

  saveResults(sweptDPOAEResults: SweptDpoaeResultsInterface) {
    this.sweptDPOAEResults = sweptDPOAEResults;
    this.resultsModel.updateCurrentPage({ response: sweptDPOAEResults });
  }

  private async beginExam() {
    this.device = this.deviceUtil.getDeviceFromTabsintId(this.tabsintId);
    if (this.device) {
      const examProperties = {
        OutputChannel1: handleOutputCalibration(this.outputChannel1, this.outputCalibrationType),
        OutputChannel2: handleOutputCalibration(this.outputChannel2, this.outputCalibrationType),
        InputChannel: this.inputChannel,
        F2Start: this.f2Start,
        F2End: this.f2End,
        Ratio: this.ratio,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        L1: this.l1,
        L2: this.l2,
        MinSweeps: this.minSweeps,
        MaxSweeps: this.maxSweeps,
        NoiseFloorThreshold: this.noiseFloorThreshold,
        SNRThreshold: this.SNRThreshold,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        Filename: this.filename,
        OutputRawMeasurements: this.outputRawMeasurements,
      };
      await this.devicesService.queueExam(this.device, 'SweptDPOAE', examProperties);
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up Swept DPOAE exam');
    }
  }
}
