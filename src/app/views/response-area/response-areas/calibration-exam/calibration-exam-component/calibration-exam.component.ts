import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output} from '@angular/core';
import { PageModel } from "../../../../../models/page/page.service";
import { Subscription } from 'rxjs';
import { CalibrationExamInterface, EarData, ExamResponse } from './calibration-exam.interface';
import { PageInterface } from "../../../../../models/page/page.interface";
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { Logger } from '../../../../../utilities/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { MeasurementScreenComponent } from '../measurement-screen/measurement-screen.component';
import { MaxOutputScreenComponent } from '../max-output-screen/max-output-screen.component';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { CalibrationResultsViewerComponent } from '../calibration-results-viewer/calibration-results-viewer.component';


@Component({
  selector: 'app-calibration-exam',
  templateUrl: './calibration-exam.component.html',
  styleUrls: ['./calibration-exam.component.css']
})
export class CalibrationExamComponent implements OnInit, OnDestroy {
  @ViewChild(CalibrationResultsViewerComponent) resultsViewer!: CalibrationResultsViewerComponent;
  @ViewChild(MeasurementScreenComponent) measurementScreen!: MeasurementScreenComponent
  @ViewChild(MaxOutputScreenComponent) maxOutputScreen!: MaxOutputScreenComponent
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
  tympanSubscription: Subscription | undefined;
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

  constructor(private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService
  ) {
    this.results = this.resultsModel.getResults()
    this.examService.submit = () => {
      this.nextStep();
    };;
    this.examService.back = () => {
      this.previousStep();
    };;
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === "calibrationResponseArea") {
        const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;
        if (calibrationResponse) {
          this.frequencies = calibrationResponse.frequencies ?? [500, 1000, 2000];
          this.targetLevels = calibrationResponse.targetLevels ?? [60, 70, 80];
          this.initializeEarData();
          this.updateFrequencyAndTargetLevel();
          this.showResults = calibrationResponse.showResults ?? true;
          this.device = this.deviceUtil.getDeviceFromTabsintId(calibrationResponse.tabsintId ?? "1");
          if (this.device) {
            let resp = await this.devicesService.queueExam(this.device, "HNCalibration", { "OutputChannel": this.earCup == "Left" ? "HPL0" : "HPR0" });
            this.logger.debug("resp from tympan after calibration exam queue exams:" + resp);
          } else {
            this.logger.error("Error setting up HNCalibration exam");
          }
        }
      }
    });
    this.results.currentExam.responses = [];
    this.updateButtonLabel();
  }

  async ngOnDestroy(): Promise<void> {
    this.isPlaying = false;
    await this.stopTone();
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after calibration exam abort exams:" + resp);
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.back = this.examService.back.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.tympanSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit");
  }

  async adjustCalFactor(amount: number): Promise<void> {
    this.calFactor += amount;
    if (this.isPlaying) {
      await this.playTone(this.calFactor);
    }
  }

  async togglePlay(): Promise<void> {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.currentStep === 'max-output') {
        await this.playTone(0)
      } else {
        await this.playTone(this.calFactor);
      }
    } else {
      await this.stopTone();
    }
  }

  updateButtonLabel(): void {
    if (this.currentStep === 'calibration') {
      this.buttonTextService.updateButtonText('Next');
    } else if (this.currentStep === 'measurement' || this.currentStep === 'max-output') {
      this.buttonTextService.updateButtonText('Submit');
    }
    else if (this.currentStep === 'finished') {
      this.buttonTextService.updateButtonText('Finish Calibration');
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
      case 'measurement':
        await this.handleMeasurementStep();
        break;
      case 'max-output':
        await this.handleMaxOutputStep();
        break;
      default:
        console.error(`Unknown step: ${this.currentStep}`);
        return;
    }

    this.updateFrequencyAndTargetLevel();
    this.updateUserInput();
    this.updateButtonLabel();
  }

  private async handleCalibrationStep(): Promise<void> {
    await this.playTone(this.calFactor);
    this.currentStep = 'measurement';
  }

  private async handleMeasurementStep(): Promise<void> {
    const isValid = this.measurementScreen?.validateAndProceed();
    if (!isValid) {
      this.navigationHistory.pop();
      return;
    }

    if (this.currentFrequencyIndex < this.frequencies.length - 1) {
      this.currentFrequencyIndex++;
      await this.sendExamSubmission("CalibrationFactor");
      this.currentStep = 'calibration';
    } else {
      await this.finalizeMeasurementStep();
    }
  }

  private async finalizeMeasurementStep(): Promise<void> {
    this.currentStep = 'max-output';
    this.isPlaying = false;
    await this.sendExamSubmission("CalibrationFactor");
    await this.stopTone();
    this.currentFrequencyIndex = 0;
  }

  private async handleMaxOutputStep(): Promise<void> {
    const isValid = this.maxOutputScreen?.validateAndProceed();
    if (!isValid) {
      this.navigationHistory.pop();
      return;
    }
    await this.sendExamSubmission("MaximumOutputLevel");
    this.handleNextEarOrFinish();
  }

  private async updateUserInput(): Promise<void> {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;

    switch (this.currentStep) {
      case 'calibration':
        this.userInput = Number(currentEarData[this.currentFrequency].measurement) || null;
        if (this.isPlaying) {
          await this.playTone(this.calFactor);
        }
        break;
      case 'max-output':
        this.userInput = Number(currentEarData[this.currentFrequency].maxOutput) || null;
        if (this.isPlaying) {
          await this.playTone(0);
        }
        break;
    }
  }


  async handleEntryClicked(entry: { frequency: string, ear: string }): Promise<void> {
    this.showSkipButton = true;
    const frequencyIndex = this.frequencies.indexOf(+entry.frequency);
    if (frequencyIndex === -1) {
      console.error(`Frequency ${entry.frequency} not found in frequencies array.`);
      return;
    }
    this.currentStep = 'calibration';
    this.currentFrequency = +entry.frequency;
    this.earCup = entry.ear;
    this.currentFrequencyIndex = frequencyIndex;
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after calibration exam abort exams:" + resp);
    resp = await this.devicesService.queueExam(this.device!, "HNCalibration", { "OutputChannel": this.earCup == "Left" ? "HPL0" : "HPR0" });
    this.logger.debug("resp from tympan after calibration exam queue exam:" + resp);
    this.userInput = Number(currentEarData[this.currentFrequency].measurement) || null;
    while (this.navigationHistory.length > 0) {
      const lastEntry = this.navigationHistory[this.navigationHistory.length - 1];
      if (
        lastEntry.frequencyIndex === this.currentFrequencyIndex &&
        lastEntry.earCup === this.earCup && lastEntry.step==="calibration"
      ) {
        const element = this.navigationHistory.pop()!;
        this.poppedHistory.push(element);
        break;
      }
      this.poppedHistory.push(this.navigationHistory.pop()!); // Store popped entries
    }
    this.examService.submit = () => {
      this.nextStep();
    };;
    this.updateButtonLabel();
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
        this.nextStep();
    };

    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after calibration exam abort exams:" + resp);

    resp = await this.devicesService.queueExam(this.device!, "HNCalibration", {
        "OutputChannel": this.earCup === "Left" ? "HPL0" : "HPR0",
    });
    this.logger.debug("resp from tympan after calibration exam queue exam:" + resp);
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
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after calibration exam abort exams:" + resp);

    resp = await this.devicesService.queueExam(this.device!, "HNCalibration", {
        "OutputChannel": this.earCup === "Left" ? "HPL0" : "HPR0",
    });
    this.logger.debug("resp from tympan after calibration exam queue exam:" + resp);
}

private updateUserInputBasedOnStep(): void {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;

    switch (this.currentStep) {
        case 'calibration':
            this.calFactor = currentEarData[this.currentFrequency]?.calFactor ?? this.calFactor;
            break;
        case 'measurement':
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
            navEntry.frequencyIndex === poppedEntry.frequencyIndex &&
            navEntry.earCup === poppedEntry.earCup &&
            navEntry.step === poppedEntry.step
        )
    );
    restoredEntries = restoredEntries.reverse()
    this.navigationHistory.push(...restoredEntries);
    this.poppedHistory = [];
    this.currentStep = 'finished';
    this.examService.submit = this.examService.submitDefault.bind(this.examService); 
    this.updateButtonLabel();
    if (this.isPlaying) {
      this.togglePlay()
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
      await this.writeCalibrationResults();
      this.isPlaying = false;
      await this.stopTone();
      let resp = await this.devicesService.abortExams(this.device!);
      this.logger.debug("resp from tympan after calibration exam abort exams:" + resp);
      resp = await this.devicesService.queueExam(this.device!, "HNCalibration", { "OutputChannel": this.earCup == "Left" ? "HPL0" : "HPR0" });
      this.logger.debug("resp from tympan after calibration exam queue exam:" + resp);
    } else {
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

  private updateCalibrationData(frequency: number, calFactor: number | null, measurement: number | null = null, maxOutput: number | null = null): void {
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

  private async playTone(requestedLevel:number) {
    const enableOutput = this.isPlaying;
    let examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": requestedLevel,
      EnableOutput: enableOutput
    };
    let resp = await this.devicesService.examSubmission(this.device!, examProperties);
    this.logger.debug("resp from tympan after calibration exam exam submission:" + resp);
  }

  
  private async sendExamSubmission(mode: "MaximumOutputLevel" | "CalibrationFactor"): Promise<void> {
    const level = mode === "MaximumOutputLevel"
      ? this.getMaxOutputLevelForFrequency(this.currentFrequency)
      : this.getMeasuredLevelForFrequency(this.currentFrequency);
    const requestedLevel = mode === "CalibrationFactor" ? this.calFactor : 0;
    const enableOutput = this.isPlaying;
  
    const examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": requestedLevel,
      "EnableOutput": enableOutput,
      "MeasuredLevel": level,
      "Mode": mode
    };
  
    const resp = await this.devicesService.examSubmission(this.device!, examProperties);
    this.logger.debug(`resp from tympan after calibration exam exam submission (${mode}): ${resp}`);
  }

  private getMeasuredLevelForFrequency(currentFrequency: number) {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    return currentEarData[currentFrequency].measurement
  }

  private getMaxOutputLevelForFrequency(currentFrequency:number){
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    return currentEarData[currentFrequency].maxOutput
  }


  private async stopTone() {
    let resp = await this.devicesService.examSubmission(this.device!, { "EnableOutput": false });
    this.logger.debug("resp from tympan after calibration exam submission exams:" + resp);
  }

  private saveResults(): void {
    const calibrationResults = {
      leftEar: this.leftEarData,
      rightEar: this.rightEarData
    };
    const newResponse: ExamResponse = {
      pageId: 'calibration-results',
      response: JSON.stringify(calibrationResults),
      responseArea: 'calibrationExam'
    };

    this.results.currentExam.responses.push(newResponse);
  }

  private async writeCalibrationResults(): Promise<void> {
    const calibrationData = {
      "WriteCalibration": true
    };
    let resp = await this.devicesService.examSubmission(this.device!, calibrationData);
    this.logger.debug("resp from tympan after calibration exam submission exams:" + resp);
  }
}
