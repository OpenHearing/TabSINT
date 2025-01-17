import { Component, OnDestroy, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../controllers/devices.service';
import { DeviceUtil } from '../../../../../utilities/device-utility';
import { Logger } from '../../../../../utilities/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { mrtSchema } from '../../../../../../schema/response-areas/mrt.schema';
import { MrtExamInterface, MrtPresentationInterface } from './mrt-exam.interface';

@Component({
  selector: 'mrt-exam',
  templateUrl: './mrt-exam.component.html',
  styleUrl: './mrt-exam.component.css'
})
export class MrtExamComponent implements OnInit, OnDestroy {
  results: ResultsInterface;

  tabsintId: string = mrtSchema.properties.tabsintId.default;
  showResults: boolean = mrtSchema.properties.showResults.default;
  currentStep: string = 'Ready';
  numWavChannels!: number;
  outputChannel!: string | string[];
  presentationList!: MrtPresentationInterface[];

  pageSubscription: Subscription | undefined;
  device: ConnectedDevice | undefined;
  
  constructor(
    private readonly pageModel: PageModel,
    private readonly devicesService: DevicesService,
    private readonly deviceUtil: DeviceUtil, 
    private readonly logger: Logger, 
    private readonly resultsModel: ResultsModel,
    private readonly examService: ExamService, 
    private readonly buttonTextService: ButtonTextService,
  ) {
    this.results = this.resultsModel.getResults();
    this.examService.submit = this.nextStep.bind(this);
  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'mrtResponseArea') {
        setTimeout(() => {
          this.initializeResponseArea(updatedPage.responseArea as MrtExamInterface);
          this.setupDevice(updatedPage.responseArea as MrtExamInterface);
        });
      }
    })
  }

  async ngOnDestroy(): Promise<void> {
    let resp = await this.devicesService.abortExams(this.device!);
    this.logger.debug("resp from tympan after MRT exam abort exams:" + resp);
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText("Submit");
  }

  async nextStep(): Promise<void> {
    switch (this.currentStep) {
      case 'Ready':
        await this.beginExam();
        this.currentStep = 'Exam';
        this.buttonTextService.updateButtonText('Next');
        break;
      case 'Exam':
        this.currentStep = 'results';
        this.buttonTextService.updateButtonText('Finish');
        break;
      case 'results':
        this.examService.submitDefault();
        break;
    }
  }

  saveResults() {
    this.results.currentPage.response = 'TBD';
  }

  private async beginExam() {
    for (const mrtPresentation of this.presentationList) {
      let examProperties = {
        SoundFileName: mrtPresentation.filename,
        LeveldBSpl: mrtPresentation.leveldBSpl,
        UseMetaRMS: mrtPresentation.useMeta
      };
      let resp = await this.devicesService.examSubmission(this.device!, examProperties);
    }
  }

  private initializeResponseArea(responseArea: MrtExamInterface) {
    this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
    this.showResults = responseArea.showResults ?? this.showResults;
    this.numWavChannels = responseArea.numWavChannels;
    this.outputChannel = responseArea.outputChannel;
    this.presentationList = responseArea.presentationList;
  }
    
  private async setupDevice(updatedResponseArea: MrtExamInterface) {
      this.device = this.deviceUtil.getDeviceFromTabsintId(updatedResponseArea.tabsintId ?? "1");
      if (this.device) {
        const examProperties = {
          NumWavChannels: this.numWavChannels,
          OutputChannel: this.outputChannel
        };
          await this.devicesService.queueExam(this.device, "MrtExam", examProperties);
      } else {
          this.logger.error("Error setting up MRT exam");
      }
  }
    
}