import { Component, OnDestroy, OnInit } from '@angular/core';
import { sweptOaeSchema } from '../../../../../../schema/response-areas/swept-oae.schema';
import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { Logger } from '../../../../../utilities/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { Subscription } from 'rxjs/internal/Subscription';
import { SweptOaeInterface } from './sept-oae-exam.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { DevicesModel } from '../../../../../models/devices/devices-model.service';

@Component({
  selector: 'swept-oae-exam',
  templateUrl: './swept-oae-exam.component.html',
  styleUrl: './swept-oae-exam.component.css'
})
export class SweptOaeExamComponent implements OnInit, OnDestroy {
  tabsintId: string = sweptOaeSchema.properties.tabsintId.default;
  f2Start: number = sweptOaeSchema.properties.f2Start.default;
  f2End: number = sweptOaeSchema.properties.f2End.default;
  frequencyRatio: number = sweptOaeSchema.properties.frequencyRatio.default;
  sweepDuration: number = sweptOaeSchema.properties.sweepDuration.default;
  windowDuration: number = sweptOaeSchema.properties.windowDuration.default;
  sweepType: number = sweptOaeSchema.properties.sweepType.default;
  minSweeps: number = sweptOaeSchema.properties.minSweeps.default;
  maxSweeps: number = sweptOaeSchema.properties.maxSweeps.default;
  noiseFloorThreshold: number = sweptOaeSchema.properties.noiseFloorThreshold.default;
  results: ResultsInterface;
  showResults: boolean = sweptOaeSchema.properties.showResults.default;
  pageSubscription: Subscription | undefined;
  tympanSubscription: Subscription | undefined;
  currentStep: string = 'input-parameters';
  device: ConnectedDevice | undefined;

  constructor(
    private readonly pageModel: PageModel,
    private readonly devicesModel: DevicesModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService 
  ) {
    this.results = this.resultsModel.getResults()
    this.examService.submit = this.nextStep.bind(this);
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'sweptOAEResponseArea') {
        const responseArea = updatedPage.responseArea as SweptOaeInterface;
        this.tabsintId = responseArea.tabsintId ?? sweptOaeSchema.properties.tabsintId.default;
        this.f2Start = responseArea.f2Start ?? sweptOaeSchema.properties.f2Start.default;
        this.f2End = responseArea.f2End ?? sweptOaeSchema.properties.f2End.default;
        this.frequencyRatio = responseArea.frequencyRatio ?? sweptOaeSchema.properties.frequencyRatio.default;
        this.sweepDuration = responseArea. sweepDuration ?? sweptOaeSchema.properties.sweepDuration.default;
        this.windowDuration = responseArea.windowDuration ?? sweptOaeSchema.properties.windowDuration.default;
        this.sweepType = responseArea.sweepType ?? sweptOaeSchema.properties.sweepType.default;
        this.minSweeps = responseArea.minSweeps ?? sweptOaeSchema.properties.minSweeps.default;
        this.maxSweeps = responseArea.maxSweeps ?? sweptOaeSchema.properties.maxSweeps.default;
        this.noiseFloorThreshold = responseArea.noiseFloorThreshold ?? sweptOaeSchema.properties.noiseFloorThreshold.default;
      }
    })
  }

  ngOnDestroy(): void {
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.tympanSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit");
  }

  async nextStep(): Promise<void> {
    switch (this.currentStep) {
      case 'input-parameters':
        this.beginExam();
        this.currentStep = 'in-progress';
        this.buttonTextService.updateButtonText('Next');
        break;
      case 'in-progress':
        this.currentStep = 'results';
        this.buttonTextService.updateButtonText('Finish');
        break;
      case 'results':
        this.saveResults();
        this.examService.submitDefault();
        break;
    }
  }

  private async beginExam() {
    this.device = this.deviceUtil.getDeviceFromTabsintId(this.tabsintId);
    if (this.device) {
        const examProperties = {
          F2Start: this.f2Start,
          F2End:  this.f2End,
          Ratio: this.frequencyRatio,
          SweepDuration: this.sweepDuration,
          SweepType: this.sweepType,
          MinSweeeps: this.minSweeps,
          MaxSweeps: this.maxSweeps,
          NoiseFloorThreshold: this.noiseFloorThreshold,
          WindowDuration: this.windowDuration
        };
        await this.devicesService.queueExam(this.device, "SweptDPOAE", examProperties);
    } else {
        this.logger.error("Error setting up Manual Audiometry exam");
    }
  }

  private getPartialResults() {
    // If exam is done, save results, enable next button

    // Else, display results and request results again 
  }

  private displayPartialResults() {

  }

  private saveResults() {

  }

}
