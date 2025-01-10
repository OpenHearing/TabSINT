import { Component, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { Logger } from '../../../../../utilities/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { WAIInterface, WAIResultsInterface } from './wai-exam.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { waiSchema } from '../../../../../../schema/response-areas/wai.schema';

@Component({
  selector: 'wai-exam',
  templateUrl: './wai-exam.component.html',
  styleUrl: './wai-exam.component.css'
})
export class WAIExamComponent implements OnInit, OnDestroy {
  tabsintId: string = waiSchema.properties.tabsintId.default;
  fStart: number = waiSchema.properties.fStart.default;
  fEnd: number = waiSchema.properties.fEnd.default;
  sweepDuration: number = waiSchema.properties.sweepDuration.default;
  sweepType: string = waiSchema.properties.sweepType.default;
  level: number = waiSchema.properties.level.default;
  numSweeps: number = waiSchema.properties.numSweeps.default;
  windowDuration: number = waiSchema.properties.windowDuration.default;
  numFrequencies: number = waiSchema.properties.numFrequencies.default;
  filename: string = waiSchema.properties.filename.default;
  outputRawMeasurements: boolean = waiSchema.properties.outputRawMeasurements.default;
  results: ResultsInterface;
  showResults: boolean = waiSchema.properties.showResults.default;
  pageSubscription: Subscription | undefined;
  currentStep: string = 'input-parameters';
  device: ConnectedDevice | undefined;
  waiResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  
  // Set dimensions and margins
  margin = { top: 20, right: 30, bottom: 60, left: 70 };
  width = 450 - this.margin.left - this.margin.right;
  height = 300 - this.margin.top - this.margin.bottom;
  xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000].filter(tick => tick >= this.fStart && tick <= this.fEnd);

  // Define scales
  xScale = d3.scaleLog()
    .domain([this.fStart, this.fEnd])
    .range([0, this.width]);

  yScale = d3.scaleLinear()
    .domain([-20, 70])
    .range([this.height, 0]);  

  constructor(
    private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService,
  ) {
    this.results = this.resultsModel.getResults();
    this.examService.submit = this.nextStep.bind(this);
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'WAIResponseArea') {
        const responseArea = updatedPage.responseArea as WAIInterface;
        this.tabsintId = responseArea.tabsintId ?? waiSchema.properties.tabsintId.default;
        this.fStart = responseArea.fStart ?? waiSchema.properties.fStart.default;
        this.fEnd = responseArea.fEnd ?? waiSchema.properties.fEnd.default;
        this.sweepDuration = responseArea. sweepDuration ?? waiSchema.properties.sweepDuration.default;
        this.sweepType = responseArea.sweepType ?? waiSchema.properties.sweepType.default;
        this.level = responseArea.level ?? waiSchema.properties.level.default;
        this.numSweeps = responseArea.numSweeps ?? waiSchema.properties.numSweeps.default;
        this.windowDuration = responseArea.windowDuration ?? waiSchema.properties.windowDuration.default;
        this.numFrequencies = responseArea.numFrequencies ?? waiSchema.properties.numFrequencies.default;
        this.filename = responseArea.filename ?? waiSchema.properties.filename.default;
        this.outputRawMeasurements = responseArea.outputRawMeasurements ?? waiSchema.properties.outputRawMeasurements.default;
      }
    })
  }

  async ngOnDestroy(): Promise<void> {
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after WAI exam abort exams:" + resp);
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit");
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

  saveResults(waiResults: WAIResultsInterface) {
    this.waiResults = waiResults;
    this.results.currentPage.response = waiResults;
  }

  private async beginExam() {
    this.device = this.deviceUtil.getDeviceFromTabsintId(this.tabsintId);
    if (this.device) {
      const examProperties = {
        FStart: this.fStart,
        FEnd:  this.fEnd,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        Level: this.level,
        NumSweeps: this.numSweeps,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        Filename: this.filename,
        OutputRawMeasurements: this.outputRawMeasurements
      };
      await this.devicesService.queueExam(this.device, "WAI", examProperties);
    } else {
      this.logger.error("Error setting up WAI exam");
    }
  }
}