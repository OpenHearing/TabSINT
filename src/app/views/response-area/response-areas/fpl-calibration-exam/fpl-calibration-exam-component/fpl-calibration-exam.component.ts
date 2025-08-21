import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { PageModel } from "../../../../../models/page/page.service";
import { FPLCalibrationExamInterface } from './fpl-calibration-exam.interface';
import { PageInterface } from "../../../../../models/page/page.interface";
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { Logger } from '../../../../../utilities/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { FPLcalibrationExamSchema } from '../../../../../../schema/response-areas/fpl-calibration-exam.schema';
import { waiSchema } from '../../../../../../schema/response-areas/wai.schema';
import { WAIResultsInterface } from '../../wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';

@Component({
  selector: 'app-fpl-calibration-exam',
  templateUrl: './fpl-calibration-exam.component.html',
  styleUrls: ['./fpl-calibration-exam.component.css']
})
export class FPLCalibrationExamComponent implements OnInit, OnDestroy {
  currentStep: string = 'landing';
  pageSubscription: Subscription | undefined;
  tympanSubscription: Subscription | undefined;
  device: ConnectedDevice | undefined;
  tabsintId: string = FPLcalibrationExamSchema.properties.tabsintId.default;
  results: ResultsInterface;
  navigationHistory: { step: string; outputChannel: string; }[] = [];
  outputChannelIndex: number = 0;
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  abortText: string = "";
  state: StateInterface;
  inProgressResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  inProgressResultsSubject = new BehaviorSubject<WAIResultsInterface>(this.inProgressResults);
  inProgressResultsSubscription: Subscription | undefined;

  // Default to WAI default, but this will be overwritten with FPL response area values
  outputChannels: string[] = [];
  outputChannel: string = waiSchema.properties.outputChannel.default;

  // WAI parameters from FPL calibration response area
  fStart: number = FPLcalibrationExamSchema.properties.fStart.default;
  fEnd: number = FPLcalibrationExamSchema.properties.fEnd.default;
  sweepDuration: number = FPLcalibrationExamSchema.properties.sweepDuration.default;
  numFrequencies: number = FPLcalibrationExamSchema.properties.numFrequencies.default;

  // WAI parameters not specified from FPL calibration response area
  sweepType: string = waiSchema.properties.sweepType.default;
  l: number = waiSchema.properties.l.default;
  numSweeps: number = waiSchema.properties.numSweeps.default;
  inputChannels: Array<string> = waiSchema.properties.inputChannels.default;
  aurenInsideDiameter: number = waiSchema.properties.aurenInsideDiameter.default;
  aurenLength: number = waiSchema.properties.aurenLength.default;
  earCanalDiameter: number = waiSchema.properties.earCanalDiameter.default;
  earCanalLength: number = waiSchema.properties.earCanalLength.default;
  filename: string = waiSchema.properties.filename.default;
  outputRawMeasurements: boolean = waiSchema.properties.outputRawMeasurements.default;

  // WAI parameters for FPL calibration different from WAI defaults
  windowDuration: number = (2*this.sweepDuration/(this.numFrequencies - 1));
  writeFPLCalibration: boolean = true;
  returnResultData: boolean = false;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService,
    private readonly stateModel: StateModel
  ) {
    this.results = this.resultsModel.getResults();
    this.examService.submit = () => { this.nextStep(); };
    this.examService.back = () => { this.previousStep(); };
    this.state = this.stateModel.getState();
    this.state.isSubmittable = true;
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: WAIResultsInterface) => {
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === "fplCalibrationResponseArea") {
        const responseArea = updatedPage?.responseArea as FPLCalibrationExamInterface;
        this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
        this.outputChannels = responseArea.outputChannels;
        this.fStart = responseArea.fStart ?? this.fStart;
        this.fEnd = responseArea.fEnd ?? this.fEnd;
        this.numFrequencies = responseArea.numFrequencies ?? this.numFrequencies;
        this.sweepDuration = responseArea.sweepDuration ?? this.sweepDuration;
        this.device = this.deviceUtil.getDeviceFromTabsintId(responseArea.tabsintId ?? "1");
        if (!this.device) {
          await this.devicesService.deviceNotFound();
          this.logger.error("Error setting up FPL Calibration exam, device not found.");
        }
        if (this.outputChannels.length < 1) {
          this.logger.error("Error setting up FPL Calibration exam, no outputChannel(s) specified.");
        }
      }
    });
    this.updateButtonLabel();
  }

  async ngOnDestroy(): Promise<void> {
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after fpl calibration exam abort exams:" + resp);
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.back = this.examService.back.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.tympanSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit");
    this.inProgressResultsSubscription?.unsubscribe();
    this.state.isSubmittable = true;
    this.shouldAbort = true;
  }

  async startWAIExam() {
    if (this.device) {
      const examProperties: any = {
        OutputChannel: this.outputChannel,
        FStart: this.fStart,
        FEnd:  this.fEnd,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        L: this.l,
        NumSweeps: this.numSweeps,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        Filename: this.filename,
        OutputRawMeasurements: this.outputRawMeasurements,
        InputChannels: this.inputChannels,
        AurenInsideDiameter: this.aurenInsideDiameter,
        AurenLength: this.aurenLength,
        EarCanalDiameter: this.earCanalDiameter,
        EarCanalLength: this.earCanalLength,
        WriteFPLCalibration: this.writeFPLCalibration,
        ReturnResultData: this.returnResultData,
      };
      this.state.isSubmittable = false;
      let resp = await this.devicesService.queueExam(this.device, "WAI", examProperties);
      if (resp![1] != "ERROR") {
        await this.waitForWAIExamCompletion();
      }
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error("Error setting up WAI exam during FPL calibration");
    }
  }

  async waitForWAIExamCompletion() {
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
          this.changeDetectorRef.detectChanges();
          return;
        }
      } else {
        this.logger.debug('FPL calibration request results did not return expected results. It may be too early to receive results.');
      }
  
      setTimeout(pollResults, 1000);
    };
  
    pollResults();
  }

  async abort() {
    this.shouldAbort = true;
    this.updateTextAfterAbortButtonPressed();
    await this.waitForRequestResultsDone();
    await this.devicesService.abortExams(this.device!);
    this.shouldAbort = false;
    this.updateTextAfterAbortComplete();
    this.updateStateOnAbort();
  }

  private doesRespContainResults(resp: any[] | undefined) {
    return resp !== undefined && 
           resp.length > 1 && 
           resp[1] !== 'ERROR' && 
           resp[2] !== 'timeout' &&
           resp[2] !== 'byte timeout' &&
           resp[1] !== 'OK';
  }

  private async waitForRequestResultsDone() {
    while (this.isRequestingResults) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }  
  }

  private updateStateOnAbort() {
    this.state.isSubmittable = true;
    this.inProgressResults.State = 'ABORTED';
  }

  updateButtonLabel(): void {
    if (this.currentStep === 'landing') {
      this.buttonTextService.updateButtonText('Begin');
    } else if (this.currentStep === 'calibration') {
      this.outputChannelIndex < this.outputChannels.length - 1 ? this.buttonTextService.updateButtonText('Next') : this.buttonTextService.updateButtonText('Submit');
    }
  }

  async nextStep(): Promise<void> {
    if (this.currentStep == 'landing') {
      this.currentStep = 'calibration';
      this.state.isSubmittable = false;
    } else {
      this.navigationHistory.push({
        step: this.currentStep,
        outputChannel: this.outputChannel
      });
      this.outputChannelIndex += 1;
    }
    this.resetCalibrationExam();
    this.outputChannel = this.outputChannels[this.outputChannelIndex];
    this.updateButtonLabel();
  }

  async previousStep(): Promise<void> {
    if (this.navigationHistory.length === 0) return;
    this.navigationHistory.pop();
    this.outputChannelIndex -= 1;
    this.outputChannel = this.outputChannels[this.outputChannelIndex];
    this.resetCalibrationExam();
    this.updateButtonLabel();
  }

  private resetCalibrationExam() {
    this.examService.submit = this.outputChannelIndex < this.outputChannels.length - 1 ? () => { this.nextStep(); } : () => { this.examService.submitDefault(); };
    this.examService.back = () => { this.previousStep(); };
    this.shouldAbort = false;
    this.state.isSubmittable = false;
    this.inProgressResults = {
      State: 'READY',
      PctComplete: 0
    };
  }

  private updateTextAfterAbortButtonPressed() {
    this.abortText = "Abort pressed, please wait while exam is aborted.";
  }

  private updateTextAfterAbortComplete() {
    this.abortText = "";
  }

}
