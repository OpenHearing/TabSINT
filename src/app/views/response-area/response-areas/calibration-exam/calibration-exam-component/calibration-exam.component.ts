import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output } from '@angular/core';
import { PageModel } from '../../../../../models/page/page.service';
import { Subscription } from 'rxjs';
import { CalibrationExamInterface, EarData, ExamResponse } from './calibration-exam.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../services/device-utility.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { MaxOutputScreenComponent } from '../max-output-screen/max-output-screen.component';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { CalibrationResultsViewerComponent } from '../calibration-results-viewer/calibration-results-viewer.component';
import { CalibrationScreenComponent } from '../calibration-screen/calibration-screen.component';
import { calibrationExamSchema } from '../../../../../../schema/response-areas/calibration-exam.schema';

@Component({
  selector: 'app-calibration-exam',
  templateUrl: './calibration-exam.component.html',
  styleUrls: ['./calibration-exam.component.css'],
})
export class CalibrationExamComponent implements OnInit, OnDestroy {
  @ViewChild(CalibrationResultsViewerComponent) resultsViewer!: CalibrationResultsViewerComponent;
  @ViewChild(MaxOutputScreenComponent) maxOutputScreen!: MaxOutputScreenComponent;
  @ViewChild(CalibrationScreenComponent) calibrationScreen!: CalibrationScreenComponent;
  @Output() buttonTextChange = new EventEmitter<string>();
  showSkipButton: boolean = false;
  frequencies: number[] = [];
  targetLevels: number[] = [];
  currentStep: string = 'calibration';
  currentFrequencyIndex: number = 0;
  currentFrequency: number = 0;
  targetLevel: number = 0;
  calFactor: number = -40;
  pageSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  device: ConnectedDevice | undefined;
  earCup: string = 'Left';
  isPlaying: boolean = false;
  leftEarData: Record<number, EarData> = {};
  rightEarData: Record<number, EarData> = {};
  results: ResultsInterface;
  showResults: boolean = true;
  navigationHistory: { step: string; frequencyIndex: number; earCup: string }[] = [];
  userInput: number | null = null;
  poppedHistory: { step: string; frequencyIndex: number; earCup: string }[] = [];
  batchFrequencies: boolean = calibrationExamSchema.properties.batchFrequencies.default;

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
    this.examService.back = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.previousStep();
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
      if (updatedPage?.responseArea?.type === 'calibrationResponseArea') {
        const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;
        if (calibrationResponse) {
          this.frequencies = calibrationResponse.frequencies ?? [500, 1000, 2000];
          this.targetLevels = calibrationResponse.targetLevels ?? [60, 70, 80];
          this.batchFrequencies = calibrationResponse.batchFrequencies ?? this.batchFrequencies;
          this.initializeEarData();
          this.updateFrequencyAndTargetLevel();
          this.showResults = calibrationResponse.showResults ?? true;
          await this.setupDevice(calibrationResponse);
        }
      }
    });
    this.resultsModel.updateCurrentExam({ responses: [] });
    this.updateButtonLabel();
  }

  ngOnDestroy(): void {
    this.asyncNgOnDestroy();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.examService.back = this.examService.back.bind(this.examService);
    this.buttonTextService.updateButtonText('Submit');

    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnDestroy to handle any asynchronous operations.
   */
  private async asyncNgOnDestroy(): Promise<void> {
    this.isPlaying = false;
    await this.stopTone();
    await this.devicesService.abortExams(this.device!);
  }

  private async setupDevice(updatedResponseArea: CalibrationExamInterface) {
    this.device = this.deviceUtil.getDeviceFromTabsintId(updatedResponseArea.tabsintId ?? '1');

    if (!this.device) {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up HNCalibration exam');
    } else if (this.devicesService.isDeviceMessagePending(this.device, false)) {
      await this.devicesService.deviceMessagePendingError();
      this.logger.error('Error setting up HNCalibration exam: Device message pending');
    } else {
      await this.devicesService.queueExam(this.device, 'HNCalibration', { OutputChannel: this.earCup == 'Left' ? 'HPL0' : 'HPR0' });
    }
  }

  async adjustCalFactor(amount: number): Promise<void> {
    this.calFactor += amount;
    if (this.isPlaying) {
      await this.playTone(this.calFactor);
    }
    this.updateCalibrationData(this.currentFrequency, this.calFactor, null, null);
  }

  async togglePlay(): Promise<void> {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.currentStep === 'max-output') {
        await this.playTone(0);
      } else {
        await this.playTone(this.calFactor);
      }
    } else {
      await this.stopTone();
    }
  }

  updateButtonLabel(): void {
    if (this.currentStep === 'finished') {
      this.buttonTextService.updateButtonText('Finish Calibration');
    } else {
      this.buttonTextService.updateButtonText('Submit');
    }
  }

  async nextStep(): Promise<void> {
    this.navigationHistory.push({
      step: this.currentStep,
      frequencyIndex: this.currentFrequencyIndex,
      earCup: this.earCup,
    });

    switch (this.currentStep) {
      case 'calibration':
        await this.handleCalibrationStep();
        break;
      case 'max-output':
        await this.handleMaxOutputStep();
        break;
      default:
        this.logger.error(`Unknown step: ${this.currentStep}`);
        return;
    }

    this.updateFrequencyAndTargetLevel();
    this.updateUserInputBasedOnStep();
    this.updateButtonLabel();

    // The current step has now been updated, adjust tone as needed
    if (this.isPlaying) {
      if (this.currentStep === 'calibration') {
        await this.playTone(this.calFactor);
      } else if (this.currentStep === 'max-output') {
        await this.playTone(0);
      } else {
        await this.stopTone();
      }
    }
  }

  private async handleCalibrationStep(): Promise<void> {
    const isValid = this.calibrationScreen?.validateAndProceed();
    if (!isValid) {
      return;
    }
    await this.sendExamSubmission('CalibrationFactor');

    if (this.batchFrequencies) {
      if (this.currentFrequencyIndex < this.frequencies.length - 1) {
        this.currentFrequencyIndex++;
        this.currentStep = 'calibration';
      } else {
        this.currentFrequencyIndex = 0;
        this.currentStep = 'max-output';
      }
    } else {
      this.currentStep = 'max-output';
    }
  }

  private async handleMaxOutputStep(): Promise<void> {
    const isValid = this.maxOutputScreen?.validateAndProceed();
    if (!isValid) {
      this.navigationHistory.pop();
      return;
    }
    await this.sendExamSubmission('MaximumOutputLevel');

    const nextStep = this.batchFrequencies ? 'max-output' : 'calibration';
    if (this.currentFrequencyIndex < this.frequencies.length - 1) {
      this.currentFrequencyIndex++;
      this.currentStep = nextStep;
    } else {
      await this.handleNextEarOrFinish();
    }
  }

  async handleEntryClicked(entry: { frequency: string; ear: string; step: string }): Promise<void> {
    this.showSkipButton = true;
    const frequencyIndex = this.frequencies.indexOf(+entry.frequency);
    if (frequencyIndex === -1) {
      this.logger.error(`Frequency ${entry.frequency} not found in frequencies array.`);
      return;
    }
    this.currentStep = entry.step;
    this.currentFrequency = +entry.frequency;
    this.earCup = entry.ear;
    this.currentFrequencyIndex = frequencyIndex;
    await this.devicesService.abortExams(this.device!);
    await this.devicesService.queueExam(this.device!, 'HNCalibration', { OutputChannel: this.earCup == 'Left' ? 'HPL0' : 'HPR0' });
    this.updateUserInputBasedOnStep();
    this.updateButtonLabel();
    while (this.navigationHistory.length > 0) {
      const lastEntry = this.navigationHistory[this.navigationHistory.length - 1];
      if (lastEntry.frequencyIndex === this.currentFrequencyIndex && lastEntry.earCup === this.earCup && lastEntry.step === entry.step) {
        const element = this.navigationHistory.pop()!;
        this.poppedHistory.push(element);
        break;
      }
      this.poppedHistory.push(this.navigationHistory.pop()!); // Store popped entries
    }
    this.examService.submit = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.nextStep();
    };
  }

  async previousStep(): Promise<void> {
    if (this.navigationHistory.length === 0) return;

    const previousState = this.navigationHistory.pop()!;
    if (this.currentStep === 'finished') {
      await this.handleFinishedStep();
    }

    this.restorePreviousState(previousState);

    if (this.isStepOrEarCupChanged(previousState)) {
      await this.handleStepOrEarCupChange();
    }

    this.updateFrequencyAndTargetLevel();
    this.updateUserInputBasedOnStep();
    this.updateButtonLabel();

    if (this.isPlaying) {
      this.togglePlay();
    }
  }

  private async handleFinishedStep(): Promise<void> {
    this.examService.submit = () => {
      !this.devicesService.isDeviceMessagePending(this.device) && this.nextStep();
    };

    await this.devicesService.abortExams(this.device!);

    await this.devicesService.queueExam(this.device!, 'HNCalibration', {
      OutputChannel: this.earCup === 'Left' ? 'HPL0' : 'HPR0',
    });
  }

  private restorePreviousState(previousState: any): void {
    this.currentStep = previousState.step;
    this.currentFrequencyIndex = previousState.frequencyIndex;
    this.earCup = previousState.earCup;
  }

  private isStepOrEarCupChanged(previousState: any): boolean {
    return previousState.earCup !== this.earCup || this.currentStep === 'finished';
  }

  private async handleStepOrEarCupChange(): Promise<void> {
    await this.devicesService.abortExams(this.device!);
    await this.devicesService.queueExam(this.device!, 'HNCalibration', {
      OutputChannel: this.earCup === 'Left' ? 'HPL0' : 'HPR0',
    });
  }

  private updateUserInputBasedOnStep(): void {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;

    switch (this.currentStep) {
      case 'calibration':
        this.calFactor = currentEarData[this.currentFrequency]?.calFactor ?? this.calFactor;
        this.userInput = Number(currentEarData[this.currentFrequency]?.measurement) || null;
        break;
      case 'max-output':
        this.userInput = Number(currentEarData[this.currentFrequency]?.maxOutput) || null;
        break;
    }
  }

  async skip(): Promise<void> {
    this.showSkipButton = false;
    this.saveResults();
    let restoredEntries = this.poppedHistory.filter(
      poppedEntry =>
        !this.navigationHistory.some(
          navEntry =>
            navEntry.frequencyIndex === poppedEntry.frequencyIndex && navEntry.earCup === poppedEntry.earCup && navEntry.step === poppedEntry.step
        )
    );
    restoredEntries = restoredEntries.reverse();
    this.navigationHistory.push(...restoredEntries);
    this.poppedHistory = [];
    this.currentStep = 'finished';
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.updateButtonLabel();
    if (this.isPlaying) {
      this.togglePlay();
    }
    // let resp = await this.devicesService.abortExams(this.device!);
    await this.writeCalibrationResults();
  }

  handleMeasurementUpdate(measurement: number): void {
    this.updateCalibrationData(this.currentFrequency, this.calFactor, measurement, null);
  }

  handleMaxOutputUpdate(maxOutput: number): void {
    this.updateCalibrationData(this.currentFrequency, null, null, maxOutput);
  }

  private async handleNextEarOrFinish(): Promise<void> {
    if (this.currentFrequencyIndex < this.frequencies.length - 1) {
      this.currentFrequencyIndex++;
    } else if (this.earCup === 'Left') {
      this.earCup = 'Right';
      this.currentFrequencyIndex = 0;
      this.currentStep = 'calibration';
      this.isPlaying = false;
      await this.stopTone();
      await this.writeCalibrationResults();
      await this.devicesService.abortExams(this.device!);
      await this.devicesService.queueExam(this.device!, 'HNCalibration', { OutputChannel: this.earCup == 'Left' ? 'HPL0' : 'HPR0' });
    } else {
      this.isPlaying = false;
      await this.stopTone();
      this.currentStep = 'finished';
      this.examService.submit = this.examService.submitDefault.bind(this.examService);
      this.saveResults();
      await this.writeCalibrationResults();
    }
  }

  private updateFrequencyAndTargetLevel(): void {
    this.currentFrequency = this.frequencies[this.currentFrequencyIndex];
    this.targetLevel = this.targetLevels[this.currentFrequencyIndex];
  }

  private initializeEarData(): void {
    this.frequencies.forEach(freq => {
      this.leftEarData[freq] = { calFactor: this.calFactor, measurement: '', maxOutput: '' };
      this.rightEarData[freq] = { calFactor: this.calFactor, measurement: '', maxOutput: '' };
    });
  }

  private updateCalibrationData(
    frequency: number,
    calFactor: number | null,
    measurement: number | null = null,
    maxOutput: number | null = null
  ): void {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    if (calFactor !== null) {
      currentEarData[frequency].calFactor = calFactor;
    }

    if (measurement !== null) {
      currentEarData[frequency].measurement = measurement;
    }

    if (maxOutput !== null) {
      currentEarData[frequency].maxOutput = maxOutput;
    }
  }

  private async playTone(requestedLevel: number) {
    const enableOutput = this.isPlaying;
    const examProperties = {
      F: this.currentFrequency,
      RequestedLevel: requestedLevel,
      EnableOutput: enableOutput,
    };
    await this.devicesService.examSubmission(this.device!, examProperties);
  }

  private async sendExamSubmission(mode: 'MaximumOutputLevel' | 'CalibrationFactor'): Promise<void> {
    const level =
      mode === 'MaximumOutputLevel'
        ? this.getMaxOutputLevelForFrequency(this.currentFrequency)
        : this.getMeasuredLevelForFrequency(this.currentFrequency);
    const requestedLevel = mode === 'CalibrationFactor' ? this.calFactor : 0;
    const enableOutput = this.isPlaying;

    const examProperties = {
      F: this.currentFrequency,
      RequestedLevel: requestedLevel,
      EnableOutput: enableOutput,
      MeasuredLevel: level,
      Mode: mode,
    };

    await this.devicesService.examSubmission(this.device!, examProperties);
  }

  private getMeasuredLevelForFrequency(currentFrequency: number) {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    return currentEarData[currentFrequency].measurement;
  }

  private getMaxOutputLevelForFrequency(currentFrequency: number) {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    return currentEarData[currentFrequency].maxOutput;
  }

  private async stopTone() {
    await this.devicesService.examSubmission(this.device!, { EnableOutput: false });
  }

  private saveResults(): void {
    const calibrationResults = {
      leftEar: this.leftEarData,
      rightEar: this.rightEarData,
    };
    const newResponse: ExamResponse = {
      pageId: 'calibration-results',
      response: JSON.stringify(calibrationResults),
      responseArea: 'calibrationExam',
    };

    this.results.currentExam.responses.push(newResponse);
  }

  private async writeCalibrationResults(): Promise<void> {
    const calibrationData = {
      WriteCalibration: true,
    };
    await this.devicesService.examSubmission(this.device!, calibrationData);
  }
}
