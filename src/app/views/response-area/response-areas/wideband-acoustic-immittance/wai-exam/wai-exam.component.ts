import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';
import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../services/device-utility.service';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { WAIInterface, WAIResultsInterface } from './wai-exam.interface';
import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { waiSchema } from '../../../../../../schema/response-areas/wai.schema';
import { handleOutputCalibration, getCurrentDatetime } from '../../../../../utilities/exam-helper-functions';

@Component({
  selector: 'wai-exam',
  templateUrl: './wai-exam.component.html',
  styleUrl: './wai-exam.component.css',
})
export class WAIExamComponent implements OnInit, OnDestroy {
  tabsintId: string = waiSchema.properties.tabsintId.default;
  outputCalibrationType: string = waiSchema.properties.outputCalibrationType.default;
  fStart: number = waiSchema.properties.fStart.default;
  fEnd: number = waiSchema.properties.fEnd.default;
  sweepDuration: number = waiSchema.properties.sweepDuration.default;
  sweepType: string = waiSchema.properties.sweepType.default;
  l: number = waiSchema.properties.l.default;
  numSweeps: number = waiSchema.properties.numSweeps.default;
  windowDuration: number = waiSchema.properties.windowDuration.default;
  numFrequencies: number = waiSchema.properties.numFrequencies.default;
  recordFileFolder: string | undefined = waiSchema.properties.recordFileFolder.default;
  outputRawMeasurements: boolean = waiSchema.properties.outputRawMeasurements.default;
  outputChannel: string = waiSchema.properties.outputChannel.default;
  inputChannels: string[] = waiSchema.properties.inputChannels.default;
  aurenInsideDiameter: number = waiSchema.properties.aurenInsideDiameter.default;
  aurenLength: number = waiSchema.properties.aurenLength.default;
  earCanalDiameter: number = waiSchema.properties.earCanalDiameter.default;
  earCanalLength: number = waiSchema.properties.earCanalLength.default;
  writeFPLCalibration: boolean = waiSchema.properties.writeFPLCalibration.default;
  results: ResultsInterface;
  showResults: boolean = waiSchema.properties.showResults.default;
  normativeAbsorbanceDataPath: string = waiSchema.properties.normativeAbsorbanceDataPath.default;
  normativeAbsorbanceData: NormativeDataInterface[] = waiSchema.properties.normativeAbsorbanceData.default;
  pageSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  currentStep: string = 'input-parameters';
  device: ConnectedDevice | undefined;
  waiResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0,
  };
  inputParameterMap: Map<string, string> = new Map(); // Parameter map to display the user input parameters

  // Set default dimensions and margins
  margin = { top: 20, right: 30, bottom: 60, left: 70, spacerW: 80, spacerH: 70 };
  width = 650 - this.margin.left - this.margin.right - this.margin.spacerW;
  height = 700 - this.margin.top - this.margin.bottom - this.margin.spacerH;
  xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];

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
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'WAIResponseArea') {
        const responseArea = updatedPage.responseArea as WAIInterface;
        this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
        this.outputCalibrationType = responseArea.outputCalibrationType ?? this.outputCalibrationType;
        this.fStart = responseArea.fStart ?? this.fStart;
        this.fEnd = responseArea.fEnd ?? this.fEnd;
        this.sweepDuration = responseArea.sweepDuration ?? this.sweepDuration;
        this.sweepType = responseArea.sweepType ?? this.sweepType;
        this.l = responseArea.l ?? this.l;
        this.numSweeps = responseArea.numSweeps ?? this.numSweeps;
        this.windowDuration = responseArea.windowDuration ?? this.windowDuration;
        this.numFrequencies = responseArea.numFrequencies ?? this.numFrequencies;
        this.recordFileFolder = responseArea.recordFileFolder ?? this.recordFileFolder;
        this.outputRawMeasurements = responseArea.outputRawMeasurements ?? this.outputRawMeasurements;
        this.outputChannel = responseArea.outputChannel ?? this.outputChannel;
        this.inputChannels = responseArea.inputChannels ?? this.inputChannels;
        this.aurenInsideDiameter = responseArea.aurenInsideDiameter ?? this.aurenInsideDiameter;
        this.aurenLength = responseArea.aurenLength ?? this.aurenLength;
        this.earCanalDiameter = responseArea.earCanalDiameter ?? this.earCanalDiameter;
        this.earCanalLength = responseArea.earCanalLength ?? this.earCanalLength;
        this.writeFPLCalibration = responseArea.writeFPLCalibration ?? this.writeFPLCalibration;
        this.normativeAbsorbanceDataPath = responseArea.normativeAbsorbanceDataPath ?? this.normativeAbsorbanceDataPath;
        this.normativeAbsorbanceData = responseArea.normativeAbsorbanceData ?? this.normativeAbsorbanceData;

        this.inputParameterMap = new Map([
          ['Start Frequency [Hz]', this.fStart.toString()],
          ['End Frequency [Hz]', this.fEnd.toString()],
          ['Sweep Duration [s]', this.sweepDuration.toString()],
          ['Sweep Type', this.sweepType.toString()],
          ['Level', this.l.toString()],
          ['Number of Sweeps', this.numSweeps.toString()],
          ['Window Duration [s]', this.windowDuration.toString()],
          ['Number of Frequencies', this.numFrequencies.toString()],
          ['OutputRawMeasurements', this.outputRawMeasurements.toString()],
        ]);

        // Update xTicks and scales
        this.xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000].filter(tick => tick >= this.fStart && tick <= this.fEnd);
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

  saveResults(waiResults: WAIResultsInterface) {
    this.waiResults = waiResults;
    // Generate absorbance from power reflectance data (Absorbance = 1 - Reflectance)
    this.waiResults.PowerReflectance = this.waiResults.Absorbance!.map(num => 1 - num);
    // Convert ImpedancePhase from radians to degrees (multiply by 180/pi)
    this.waiResults.ImpedancePhase = this.waiResults.ImpedancePhase!.map(num => (num * 180) / Math.PI);
    this.resultsModel.updateCurrentPage({ response: waiResults });
  }

  private async beginExam() {
    this.device = this.deviceUtil.getDeviceFromTabsintId(this.tabsintId);
    if (this.device) {
      const examProperties: any = {
        FStart: this.fStart,
        FEnd: this.fEnd,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        L: this.l,
        NumSweeps: this.numSweeps,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        OutputRawMeasurements: this.outputRawMeasurements,
        OutputChannel: handleOutputCalibration(this.outputChannel, this.outputCalibrationType),
        InputChannels: this.inputChannels,
        AurenInsideDiameter: this.aurenInsideDiameter,
        AurenLength: this.aurenLength,
        EarCanalDiameter: this.earCanalDiameter,
        EarCanalLength: this.earCanalLength,
        WriteFPLCalibration: this.writeFPLCalibration,
      };
      if (this.recordFileFolder != undefined) {
        examProperties['Filename'] = this.recordFileFolder + '/' + getCurrentDatetime() + '.WAV';
      }
      await this.devicesService.queueExam(this.device, 'WAI', examProperties);
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up WAI exam');
    }
  }
}
