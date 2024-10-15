import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageModel } from "../../models/page/page.service";
import { Subscription } from 'rxjs';
import { CalibrationExamInterface } from '../../models/calibration-exam/calibration-exam.interface';
import { PageInterface } from "../../models/page/page.interface";
import { DevicesService } from '../../controllers/devices.service';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DeviceUtil } from '../../utilities/device-utility';
import { ConnectedDevice } from '../../interfaces/connected-device.interface';
import { Logger } from '../../utilities/logger.service';
import { DeviceResponse } from '../../models/devices/devices.interface';
import { ResultsService } from '../../controllers/results.service';
import { ContentObserver } from '@angular/cdk/observers';
import { ResultsModel } from '../../models/results/results-model.service';
import { ResultsInterface } from '../../models/results/results.interface';

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
  frequencies: number[] = [];
  targetLevels: number[] = [];
  currentStep: string = 'calibration';
  currentFrequencyIndex: number = 0;
  currentFrequency: number = 0;
  targetLevel: number = 0;
  calFactor: number = 0;
  pageSubscription: Subscription | undefined;
  deviceSubscription: Subscription|undefined;
  device: ConnectedDevice|undefined;
  earCup: string = 'Left';
  isPlaying: boolean = false;
  leftEarData: Record<number, EarData> = {};
  rightEarData: Record<number, EarData> = {};
  results: ResultsInterface;

  constructor(private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly devicesModel: DevicesModel,
    private readonly deviceUtil: DeviceUtil,private readonly logger: Logger,private readonly resultsService: ResultsService,private readonly resultsModel: ResultsModel,) {
      this.results = this.resultsModel.getResults()
    }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;

      if (calibrationResponse) {
        this.frequencies = calibrationResponse.frequencies ?? [500, 1000, 2000];
        this.targetLevels = calibrationResponse.targetLevels ?? [60, 70, 80];
        this.updateFrequencyAndTargetLevel();
        this.initializeEarData();
        this.device = this.deviceUtil.getDeviceFromTabsintId(calibrationResponse.tabsintId ?? "1");
                    if (this.device) {
                        await this.devicesService.queueExam(this.device,"ManualAudiometry");
                    } else {
                        this.logger.error("Error setting up Manual Audiometry exam");
                    }
      }
    });
    this.deviceSubscription = this.devicesModel.deviceResponseSubject.subscribe((msg: DeviceResponse) => {
      console.log("device msg:",JSON.stringify(msg));
  });
  this.results.currentExam.responses = []
  }

  ngOnDestroy(): void {
    if (this.device) {
      this.devicesService.abortExams(this.device);
    }
    this.pageSubscription?.unsubscribe();
    this.deviceSubscription?.unsubscribe();
  }

  adjustCalFactor(amount: number): void {
    this.calFactor += amount;
  }

  togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.playTone();
    } else {
      this.stopTone();
    }
  }

  nextStep(): void {
    if (this.currentStep === 'calibration') {
      this.currentStep = 'measurement';
    } else if (this.currentStep === 'measurement') {
      if (this.currentFrequencyIndex < this.frequencies.length - 1) {
        this.currentFrequencyIndex++;
        this.currentStep = 'calibration';
      } else {
        this.currentStep = 'max-output';
        this.currentFrequencyIndex = 0;
      }
    } else if (this.currentStep === 'max-output') {
        this.handleNextEarOrFinish();
    }
    this.updateFrequencyAndTargetLevel()
  }

  handleNextEarOrFinish(): void {
    if (this.currentFrequencyIndex < this.frequencies.length - 1) {
      this.currentFrequencyIndex++;
    } else if (this.earCup === 'Left') {
      this.earCup = 'Right';
      this.currentFrequencyIndex = 0;
      this.currentStep = 'calibration';
    } else {
      this.currentStep = 'finished'
      this.saveResults(); 
    }
  }

  updateFrequencyAndTargetLevel(): void {
    this.currentFrequency = this.frequencies[this.currentFrequencyIndex];
    this.targetLevel = this.targetLevels[this.currentFrequencyIndex];
  }

  private initializeEarData(): void {
    this.frequencies.forEach(freq => {
      this.leftEarData[freq] = { calFactor: 0, measurement:'',maxOutput: '' };
      this.rightEarData[freq] = { calFactor: 0, measurement:'',maxOutput: '' };
    });
  }

  updateCalibrationData(frequency: number, calFactor: number | null, measurement: number | null = null, maxOutput: number | null = null): void {
    const currentEarData = this.earCup === 'Left' ? this.leftEarData : this.rightEarData;
    if (calFactor!==null){
      currentEarData[frequency].calFactor = calFactor;
    }

    if (measurement !== null) {
      currentEarData[frequency].measurement = measurement;
    }

    if (maxOutput !== null) {
      currentEarData[frequency].maxOutput = maxOutput;
    }
  }


  isExamFinished(): boolean {
    return this.currentStep === 'finished';
  }

  playTone() {
    let examProperties = {
        "F": this.currentFrequency,
        "Level": this.targetLevel,
        "OutputChannel": this.earCup=="Left" ? "HPL0" : "HPR0"
    };
    if (this.device) {
        this.devicesService.examSubmission(this.device,examProperties);
    }
  }

  stopTone() {
    if (this.device) {
      this.devicesService.examSubmission(this.device, { "Command": "Stop" });
    }
  }

  handleMeasurementUpdate(measurement: number): void {
    console.log("Update measurement with -- " + measurement)
    this.updateCalibrationData(this.currentFrequency, this.calFactor, measurement,null);
    console.log(this.leftEarData)
    console.log(this.rightEarData)
  }

  handleMaxOutputUpdate(maxOutput: number): void {
    this.updateCalibrationData(this.currentFrequency, null, null, maxOutput);
  }

  saveResults(): void {
    console.log("save results called")
    console.log(this.leftEarData)
    console.log(this.rightEarData)
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
}
