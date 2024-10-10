import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PageInterface } from '../page/page.interface';
import { PageModel } from '../page/page.service';
import { ProtocolModel } from '../protocol/protocol-model.service';
import { ResultsModel } from '../results/results-model.service';
import { CalibrationExamInterface } from './calibration-exam.interface';

@Injectable({
  providedIn: 'root', 
})
export class CalibrationExamModel implements OnInit, OnDestroy{
  frequencies: number[] = [];
  targetLevels: number[] = [];
  currentStep: string = 'calibration';
  currentFrequencyIndex: number = 0;
  calFactor: number = 0;
  // observableVar: Observable<PageInterface>;
  pageSubscription: Subscription | undefined;


  constructor(
    public pageModel: PageModel, 
    public protocolModel: ProtocolModel, 
    public resultsModel: ResultsModel
  ) {
    // this.observableVar = this.pageModel.currentPageObservable;
    // this.pageSubscription = this.observableVar.subscribe((updatedPage: PageInterface) => {
    //   const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;

    //   if (calibrationResponse) {
    //     this.frequencies = calibrationResponse.frequencies ?? [];
    //     this.targetLevels = calibrationResponse.targetLevels ?? [];
    //   }
    // });
  }

  ngOnInit(): void {
    console.log("Printing from ngOninit")
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      const calibrationResponse = updatedPage?.responseArea as CalibrationExamInterface;

      if (calibrationResponse) {
        console.log("Priniting from ngOninit --- " + calibrationResponse.frequencies)
        this.frequencies = calibrationResponse.frequencies ?? [];
        this.targetLevels = calibrationResponse.targetLevels ?? [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
  }

  getCurrentFrequency(): number {
    return this.frequencies[this.currentFrequencyIndex];
  }

  getTargetLevel(): number {
    return this.targetLevels[this.currentFrequencyIndex];
  }

  adjustCalFactor(amount: number): void {
    this.calFactor += amount;
  }

  nextStep(): void {
    if (this.currentStep === 'calibration') {
      this.currentStep = 'measurement';
    } else if (this.currentStep === 'measurement') {
      this.currentStep = 'max-output';
    } else if (this.currentStep === 'max-output') {
      this.currentFrequencyIndex++;
      this.currentStep = 'calibration';
    }

    if (this.currentFrequencyIndex >= this.frequencies.length) {
      this.currentStep = 'finished';
    }
  }

  isExamFinished(): boolean {
    return this.currentStep === 'finished';
  }

  resetWorkflow(): void {
    this.currentStep = 'calibration';
    this.currentFrequencyIndex = 0;
    this.calFactor = 0;
  }
}
