import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output} from '@angular/core';
import { PageModel } from "../../../../../models/page/page.service";
import { Subscription } from 'rxjs';
import { CalibrationExamInterface } from './calibration-exam.interface';
import { PageInterface } from "../../../../../models/page/page.interface";
import { DevicesService } from '../../../../../controllers/devices.service';
import { DevicesModel } from '../../../../../models/devices/devices-model.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { Logger } from '../../../../../utilities/logger.service';
import { DeviceResponse } from '../../../../../models/devices/devices.interface';
import { ResultsService } from '../../../../../controllers/results.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { MeasurementScreenComponent } from '../measurement-screen/measurement-screen.component';
import { MaxOutputScreenComponent } from '../max-output-screen/max-output-screen.component';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { CalibrationResultsViewerComponent } from '../calibration-results-viewer/calibration-results-viewer.component';

export interface EarData {
  calFactor: number;
  measurement: string | number;
  maxOutput: string | number;
}

export interface ExamResponse {
  pageId: string;
  response: string;
  responseArea: string;
}

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
  deviceSubscription: Subscription | undefined;
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
    private readonly devicesModel: DevicesModel,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsService: ResultsService, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService
  ) {
    this.results = this.resultsModel.getResults()
    this.examService.submit = this.nextStep.bind(this);
    this.examService.back = this.previousStep.bind(this);
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
            await this.devicesService.queueExam(this.device, "HNCalibration", { "OutputChannel": this.earCup == "Left" ? "HPL0" : "HPR0" });
          } else {
            this.logger.error("Error setting up HNCalibration exam");
          }
        }
      }
    });
    this.deviceSubscription = this.devicesModel.deviceResponseSubject.subscribe((msg: DeviceResponse) => {
      console.log("device msg:", JSON.stringify(msg));
    });
    this.results.currentExam.responses = [];
    this.updateButtonLabel()
  }

  async ngOnDestroy(): Promise<void> {
    if (this.device) {
      this.isPlaying = false
      await this.stopTone()
      await this.devicesService.abortExams(this.device);
    }
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.back = this.examService.back.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.deviceSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit")
  }

  adjustCalFactor(amount: number): void {
    this.calFactor += amount;
    if (this.isPlaying) {
      this.playTone(this.calFactor);
    }
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.currentStep === 'max-output') {
        this.playTone(0)
      } else {
        this.playTone(this.calFactor);
      }
    } else {
      this.stopTone();
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

  nextStep(): void {
    this.navigationHistory.push({
      step: this.currentStep,
      frequencyIndex: this.currentFrequencyIndex,
      earCup: this.earCup,
    });
    if (this.currentStep === 'calibration') {
      this.playTone(this.calFactor)
      this.currentStep = 'measurement';
    } else if (this.currentStep === 'measurement') {
      const isValid = this.measurementScreen?.validateAndProceed();
      if (!isValid) {
        this.navigationHistory.pop()
        return;
      }
      if (this.currentFrequencyIndex < this.frequencies.length - 1) {
        console.log("Updating frequency")
        this.currentFrequencyIndex++;
        this.sendMeasurementLevel()
        this.currentStep = 'calibration';
        console.log(this.currentFrequency)
      } else {
        this.currentStep = 'max-output';
        this.isPlaying = false;
        this.sendMeasurementLevel()
        this.stopTone()
        this.currentFrequencyIndex = 0;
      }
    } else if (this.currentStep === 'max-output') {
      const isValid = this.maxOutputScreen?.validateAndProceed();
      if (!isValid) {
        this.navigationHistory.pop()
        return;
      }
      this.sendMaxOutputTone();
      this.handleNextEarOrFinish();
    }
    this.updateFrequencyAndTargetLevel()
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    if (this.currentStep=="calibration"){
      this.userInput = Number(currentEarData[this.currentFrequency].measurement) || null;
      if (this.isPlaying) {
        this.playTone(this.calFactor);
      }
    } 
    else if (this.currentStep=="max-output"){
      this.userInput = Number(currentEarData[this.currentFrequency].maxOutput) || null;
      if (this.isPlaying) {
        this.playTone(0)
      }
    }   
    this.updateButtonLabel();
  }

  handleEntryClicked(entry: { frequency: string, ear: string }): void {
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
    this.examService.submit = this.nextStep.bind(this);
    this.updateButtonLabel();
  }
  

  previousStep(): void {
    if (this.navigationHistory.length > 0) {
      const previousState = this.navigationHistory.pop()!;
      if (this.currentStep==='finished'){
        this.examService.submit = this.nextStep.bind(this);
      }
      this.currentStep = previousState.step;
      this.currentFrequencyIndex = previousState.frequencyIndex;
      this.earCup = previousState.earCup;
      const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
      this.updateFrequencyAndTargetLevel();
      if (this.currentStep === 'calibration') {
        this.calFactor = currentEarData[this.currentFrequency].calFactor ?? this.calFactor;
      } else if (this.currentStep === 'measurement') {
        this.userInput = Number(currentEarData[this.currentFrequency].measurement) || null;
      } else if (this.currentStep === 'max-output') {
        this.userInput = Number(currentEarData[this.currentFrequency].maxOutput) || null;
      }
      this.updateButtonLabel();
      if (this.isPlaying) {
        this.togglePlay()
      }
    }
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
      this.isPlaying = false
      await this.stopTone()
      await this.devicesService.abortExams(this.device!)
      await this.devicesService.queueExam(this.device!, "HNCalibration", { "OutputChannel": this.earCup == "Left" ? "HPL0" : "HPR0" })
    } else {
      this.currentStep = 'finished'
      this.examService.submit = this.examService.submitDefault.bind(this.examService);
      await this.writeCalibrationResults();
      this.saveResults();
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

  private playTone(requestedLevel:number) {
    const enableOutput = this.isPlaying
    let examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": requestedLevel,
      EnableOutput: enableOutput
    };
    if (this.device) {
      this.devicesService.examSubmission(this.device, examProperties);
    }
  }

  private sendMaxOutputTone(): void {
    const maxOutputLevel = this.getMaxOutputLevelForFrequency(this.currentFrequency);
    const enableOutput = this.isPlaying
    const examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": 0,
      "EnableOutput": enableOutput,
      "MeasuredLevel": maxOutputLevel,
      "Mode": "MaximumOutputLevel"
    };
    if (this.device) {
      this.devicesService.examSubmission(this.device, examProperties);
    }
  }

  private sendMeasurementLevel(): void {
    const measuredLevel = this.getMeasuredLevelForFrequency(this.currentFrequency);
    const enableOutput = this.isPlaying
    const examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": this.calFactor,
      "EnableOutput": enableOutput,
      "MeasuredLevel": measuredLevel,
      "Mode": "CalibrationFactor"
    };
    if (this.device) {
      this.devicesService.examSubmission(this.device, examProperties);
    }
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
    if (this.device) {
      this.devicesService.examSubmission(this.device, { "EnableOutput": false });
    }
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

    if (this.device) {
      this.devicesService.examSubmission(this.device, calibrationData);
    }
  }

  skip(): void {
    this.showSkipButton = false;
    console.log('Skip to results initiated.');
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
    console.log(this.navigationHistory);
    this.poppedHistory = [];
    console.log('Restored navigation history:', this.navigationHistory);
    this.currentStep = 'finished';
    this.examService.submit = this.examService.submitDefault.bind(this.examService); 
    this.updateButtonLabel();
    if (this.isPlaying) {
      this.togglePlay()
    }
  }


}
