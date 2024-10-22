import { Component, OnInit, OnDestroy, ViewChild, EventEmitter, Output } from '@angular/core';
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
  @ViewChild(MeasurementScreenComponent) measurementScreen!: MeasurementScreenComponent
  @ViewChild(MaxOutputScreenComponent) maxOutputScreen!: MaxOutputScreenComponent
  @Output() buttonTextChange = new EventEmitter<string>();
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

  constructor(private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly devicesModel: DevicesModel,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsService: ResultsService, 
    private readonly resultsModel: ResultsModel,
    private examService: ExamService, private buttonTextService: ButtonTextService
  ) {
    this.results = this.resultsModel.getResults()
    this.examService.submit = this.nextStep.bind(this);
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === "calibrationResponseArea") {
        const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;
        if (calibrationResponse) {
          this.frequencies = calibrationResponse.frequencies ?? [500, 1000, 2000];
          this.targetLevels = calibrationResponse.targetLevels ?? [60, 70, 80];
          this.updateFrequencyAndTargetLevel();
          this.initializeEarData();
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
    this.pageSubscription?.unsubscribe();
    this.deviceSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit")
  }

  adjustCalFactor(amount: number): void {
    this.calFactor += amount;
    if (this.isPlaying) {
      this.playTone();
    }
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      if (this.currentStep === 'max-output') {
        this.sendMaxOutputTone();
      } else {
        this.playTone();
      }
    } else {
      this.stopTone();
    }
  }

  updateButtonLabel(): void {
    if (this.currentStep === 'calibration') {
      this.buttonTextService.updateButtonText('Next');
    } else if (this.currentStep === 'measurement') {
      this.buttonTextService.updateButtonText('Submit');
    } else if (this.currentStep === 'finished') {
      this.buttonTextService.updateButtonText('Finish Calibration');
    }
  }

  nextStep(): void {
    if (this.currentStep === 'calibration') {
      this.playTone()
      this.currentStep = 'measurement';
    } else if (this.currentStep === 'measurement') {
      const isValid = this.measurementScreen?.validateAndProceed();
      if (!isValid) {
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
        return;
      }
      this.sendMaxOutputTone();
      this.handleNextEarOrFinish();
    }
    this.updateFrequencyAndTargetLevel()
    if (this.isPlaying && this.currentStep == "calibration") {
      this.playTone();
    }
    this.updateButtonLabel();
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
      this.leftEarData[freq] = { calFactor: 0, measurement: '', maxOutput: '' };
      this.rightEarData[freq] = { calFactor: 0, measurement: '', maxOutput: '' };
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

  private playTone() {
    const enableOutput = this.isPlaying
    let examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": this.calFactor,
      EnableOutput: enableOutput
    };
    if (this.device) {
      this.devicesService.examSubmission(this.device, examProperties);
    }
  }

  private sendMaxOutputTone(): void {
    const measuredLevel = this.getMeasuredLevelForFrequency(this.currentFrequency);
    const enableOutput = this.isPlaying
    const examProperties = {
      "F": this.currentFrequency,
      "RequestedLevel": 0,
      "EnableOutput": enableOutput,
      "MeasuredLevel": measuredLevel,
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


}
