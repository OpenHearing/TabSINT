import { Component, OnInit, OnDestroy} from '@angular/core';
import { PageModel } from "../../../../../models/page/page.service";
import { Subscription } from 'rxjs';
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

  constructor(private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService
  ) {
    this.results = this.resultsModel.getResults();
    this.examService.submit = () => { this.nextStep(); };
    this.examService.back = () => { this.previousStep(); };
  }

  // landing page with a start button
  // once started, have an obvious in progress message with abort option
  // once completed, ability to restart or confirm
  // optional back button


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
          // await this.devicesService.deviceNotFound();
          // this.logger.error("Error setting up FPL Calibration exam, device not found.");
          console.log("debug mode, no device connected");
        }
        if (this.outputChannels.length < 1) {
          this.logger.error("Error setting up FPL Calibration exam, no outputChannel(s) specified.");
        }
      }
    });
    this.updateButtonLabel();
  }

  async ngOnDestroy(): Promise<void> {
    // let resp = await this.devicesService.abortExams(this.device!);
    // this.logger.debug("resp from tympan after fpl calibration exam abort exams:" + resp);
    // this.examService.submit = this.examService.submitDefault.bind(this.examService);
    // this.examService.back = this.examService.back.bind(this.examService);
    // this.pageSubscription?.unsubscribe();
    // this.tympanSubscription?.unsubscribe();
    // this.buttonTextService.updateButtonText("Submit");
  }

  async startWAIExam() {
    this.device = this.deviceUtil.getDeviceFromTabsintId(this.tabsintId);
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
      await this.devicesService.queueExam(this.device, "WAI", examProperties);
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error("Error setting up WAI exam");
    }
  }

  async abortWAIExam() {
    // abort WAI exam
  }

  async waitForWAIExamCompletion() {
    // Poll until WAI exam completes
  }

  updateButtonLabel(): void {
    console.log("updateButtonLabel() called");
    if (this.currentStep === 'landing') {
      this.buttonTextService.updateButtonText('Begin');
    } else if (this.currentStep === 'calibration') {
      this.outputChannelIndex < this.outputChannels.length - 1 ? this.buttonTextService.updateButtonText('Next') : this.buttonTextService.updateButtonText('Submit');
    }
  }

  async nextStep(): Promise<void> {
    if (this.currentStep == 'landing') {
      this.currentStep = 'calibration';
    } else {
      this.navigationHistory.push({
        step: this.currentStep,
        outputChannel: this.outputChannel
      });
      this.outputChannelIndex += 1;
    }
    this.examService.submit = this.outputChannelIndex < this.outputChannels.length - 1 ? () => { this.nextStep(); } : () => { this.examService.submitDefault(); };
    this.outputChannel = this.outputChannels[this.outputChannelIndex];
    this.updateButtonLabel();
  }

  async previousStep(): Promise<void> {
    if (this.navigationHistory.length === 0) return;
    this.navigationHistory.pop();
    this.outputChannelIndex -= 1;
    this.outputChannel = this.outputChannels[this.outputChannelIndex];
    this.updateButtonLabel();
  }

}
