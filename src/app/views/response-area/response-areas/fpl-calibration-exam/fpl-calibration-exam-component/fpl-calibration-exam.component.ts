import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

import { PageModel } from '../../../../../models/page/page.service';
import { FPLCalibrationExamInterface } from './fpl-calibration-exam.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { FPLcalibrationExamSchema } from '../../../../../../schema/response-areas/fpl-calibration-exam.schema';
import { waiSchema } from '../../../../../../schema/response-areas/wai.schema';
import { WAIResultsInterface } from '../../wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { getCurrentDatetime } from '../../../../../utilities/exam-helper-functions';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { IDeviceResponse } from '../../../../../interfaces/devices/device-response.interface';
import { DeviceType } from '../../../../../utilities/constants';

@Component({
  selector: 'app-fpl-calibration-exam',
  templateUrl: './fpl-calibration-exam.component.html',
  styleUrls: ['./fpl-calibration-exam.component.css'],
})
export class FPLCalibrationExamComponent implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly pageModel = inject(PageModel);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly buttonTextService = inject(ButtonTextService);
  private readonly stateModel = inject(StateModel);

  allowableDevices = [DeviceType.Tympan];
  currentStep: string = 'landing';
  device: IDevice | undefined;
  tabsintId: string = FPLcalibrationExamSchema.properties.tabsintId.default;
  results: ResultsInterface;
  navigationHistory: { step: string; outputChannel: string }[] = [];
  outputChannelIndex: number = 0;
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  abortText: string = '';
  state: StateInterface;
  inProgressResults: WAIResultsInterface = {
    State: 'READY',
    PctComplete: 0,
  };
  inProgressResultsSubject = new BehaviorSubject<WAIResultsInterface>(this.inProgressResults);

  inProgressResultsSubscription: Subscription | undefined;
  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  // Default to WAI default, but this will be overwritten with FPL response area values
  outputChannels: string[] = [];
  outputChannel: string = waiSchema.properties.outputChannel.default;

  // WAI parameters from FPL calibration response area
  fStart: number = FPLcalibrationExamSchema.properties.fStart.default;
  fEnd: number = FPLcalibrationExamSchema.properties.fEnd.default;
  sweepDuration: number = FPLcalibrationExamSchema.properties.sweepDuration.default;
  windowDuration: number = FPLcalibrationExamSchema.properties.windowDuration.default;
  numFrequencies: number = FPLcalibrationExamSchema.properties.numFrequencies.default;
  recordFileFolder: string | undefined = FPLcalibrationExamSchema.properties.recordFileFolder.default;

  // WAI parameters not specified from FPL calibration response area
  sweepType: string = waiSchema.properties.sweepType.default;
  l: number = waiSchema.properties.l.default;
  numSweeps: number = waiSchema.properties.numSweeps.default;
  inputChannels: string[] = waiSchema.properties.inputChannels.default;
  aurenInsideDiameter: number = waiSchema.properties.aurenInsideDiameter.default;
  aurenLength: number = waiSchema.properties.aurenLength.default;
  earCanalDiameter: number = waiSchema.properties.earCanalDiameter.default;
  earCanalLength: number = waiSchema.properties.earCanalLength.default;
  outputRawMeasurements: boolean = waiSchema.properties.outputRawMeasurements.default;

  // WAI parameters for FPL calibration different from WAI defaults
  writeFPLCalibration: boolean = true;
  returnResultData: boolean = false;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.examService.submit = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.nextStep();
      }
    };
    this.examService.back = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.previousStep();
      }
    };
    this.examService.reset = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.resetDefault();
      }
    };
    this.examService.submitPartial = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.submitPartialDefault();
      }
    };
    this.examService.navigateToTarget = subProtocolId => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.navigateToTargetDefault(subProtocolId);
      }
    };
    this.state = this.stateModel.getState();
    this.stateModel.updateState({ isSubmittable: true });
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: WAIResultsInterface) => {
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'fplCalibrationResponseArea') {
        const responseArea = updatedPage?.responseArea as FPLCalibrationExamInterface;
        this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
        this.outputChannels = responseArea.outputChannels;
        this.fStart = responseArea.fStart ?? this.fStart;
        this.fEnd = responseArea.fEnd ?? this.fEnd;
        this.numFrequencies = responseArea.numFrequencies ?? this.numFrequencies;
        this.sweepDuration = responseArea.sweepDuration ?? this.sweepDuration;
        this.windowDuration = responseArea.windowDuration ?? this.windowDuration;
        const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
        this.device = await this.devicesService.confirmSingleDevice(deviceList);
        if (!this.device) {
          return;
        }
        if (this.outputChannels.length < 1) {
          this.logger.error('Error setting up FPL Calibration exam, no outputChannel(s) specified.');
        }
      }
    });
    this.updateButtonLabel();
  }

  ngOnDestroy(): void {
    this.asyncNgOnDestroy();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.examService.back = this.examService.backDefault.bind(this.examService);
    this.buttonTextService.updateButtonText('Submit');
    this.stateModel.updateState({ isSubmittable: true });
    this.shouldAbort = true;

    this.pageSubscription?.unsubscribe();
    this.inProgressResultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnDestroy to handle any asynchronous operations.
   */
  private async asyncNgOnDestroy(): Promise<void> {
    await this.devicesService.abortExams(this.device!);
  }

  async startWAIExam() {
    if (this.device) {
      const examProperties: any = {
        OutputChannel: this.outputChannel,
        FStart: this.fStart,
        FEnd: this.fEnd,
        SweepDuration: this.sweepDuration,
        SweepType: this.sweepType,
        L: this.l,
        NumSweeps: this.numSweeps,
        WindowDuration: this.windowDuration,
        NumFrequencies: this.numFrequencies,
        OutputRawMeasurements: this.outputRawMeasurements,
        InputChannels: this.inputChannels,
        AurenInsideDiameter: this.aurenInsideDiameter,
        AurenLength: this.aurenLength,
        EarCanalDiameter: this.earCanalDiameter,
        EarCanalLength: this.earCanalLength,
        WriteFPLCalibration: this.writeFPLCalibration,
        ReturnResultData: this.returnResultData,
      };
      if (this.recordFileFolder != undefined) {
        examProperties['Filename'] = this.recordFileFolder + '/' + getCurrentDatetime() + '.WAV';
      }
      this.stateModel.updateState({ isSubmittable: false });
      const resp = await this.devicesService.queueExam(this.device, 'WAI', examProperties);
      if (resp!.msg[1] != 'ERROR') {
        await this.waitForWAIExamCompletion();
      }
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up WAI exam during FPL calibration');
    }
  }

  async waitForWAIExamCompletion() {
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

  private updateStateOnAbort() {
    this.stateModel.updateState({ isSubmittable: true });
    this.inProgressResults.State = 'ABORTED';
  }

  updateButtonLabel(): void {
    if (this.currentStep === 'landing') {
      this.buttonTextService.updateButtonText('Begin');
    } else if (this.currentStep === 'calibration') {
      const label = this.outputChannelIndex < this.outputChannels.length - 1 ? 'Next' : 'Submit';
      this.buttonTextService.updateButtonText(label);
    }
  }

  async nextStep(): Promise<void> {
    if (this.currentStep == 'landing') {
      this.currentStep = 'calibration';
      this.stateModel.updateState({ isSubmittable: false });
    } else {
      this.navigationHistory.push({
        step: this.currentStep,
        outputChannel: this.outputChannel,
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
    this.examService.submit =
      this.outputChannelIndex < this.outputChannels.length - 1
        ? () => {
            if (!this.devicesService.isDeviceMessagePending(this.device)) {
              this.nextStep();
            }
          }
        : () => {
            this.examService.submitDefault();
          };
    this.examService.back = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.previousStep();
      }
    };
    this.shouldAbort = false;
    this.stateModel.updateState({ isSubmittable: false });
    this.inProgressResults = {
      State: 'READY',
      PctComplete: 0,
    };
  }

  private updateTextAfterAbortButtonPressed() {
    this.abortText = 'Abort pressed, please wait while exam is aborted.';
  }

  private updateTextAfterAbortComplete() {
    this.abortText = '';
  }
}
