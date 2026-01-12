import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { mrtSchema } from '../../../../../../schema/response-areas/mrt.schema';
import { MrtExamInterface, MrtResultsInterface, MrtTrialInterface, MrtTrialResultInterface } from './mrt-exam.interface';
import { StateInterface } from '../../../../../models/state/state.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { shuffleArray } from '../../../../../utilities/shuffle-array';
import { pageSchema } from '../../../../../../schema/page.schema';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { DeviceStatus, DeviceType } from '../../../../../utilities/constants';

@Component({
  selector: 'mrt-exam',
  templateUrl: './mrt-exam.component.html',
  styleUrl: './mrt-exam.component.css',
})
export class MrtExamComponent implements OnInit, OnDestroy {
  // Core Data
  DeviceStatus = DeviceStatus;
  results: ResultsInterface;
  state: StateInterface;
  mrtResults: MrtResultsInterface[] = [];
  trialListResults: MrtTrialResultInterface[] = [];

  // Configuration Variables
  allowableDevices = [DeviceType.Tympan];
  tabsintId: string = mrtSchema.properties.tabsintId.default;
  showResults: boolean = mrtSchema.properties.showResults.default;
  isAutoSubmit: boolean = pageSchema.properties.isAutoSubmit.default;
  currentStep: string = 'Ready';
  outputChannel!: string[];
  trialList!: MrtTrialInterface[];
  randomizeTrials!: boolean;

  // Controller variables
  currentTrial!: MrtTrialInterface;
  feedbackMessage: string = ' ';
  isPausedText: string = 'Pause';
  isPaused: boolean = false;
  isCorrect: boolean | null = null;
  instructions: string = 'Press Submit to start the exam.';
  pctComplete: number = 0;
  nbTrials: number = 0;
  waitingMs: number = 2000;
  device: IDevice | undefined;

  // Subscriptions
  selectedResponseIndex: number | null = null;
  pageSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor(
    private readonly buttonTextService: ButtonTextService,
    private readonly devicesService: DevicesService,
    private readonly examService: ExamService,
    private readonly logger: Logger,
    private readonly pageModel: PageModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel
  ) {
    this.state = this.stateModel.getState();
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
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'mrtResponseArea') {
        setTimeout(() => {
          this.initializeResponseArea(updatedPage.responseArea as MrtExamInterface);
          this.setupDevice(updatedPage.responseArea as MrtExamInterface);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.asyncNgOnDestroy();
    this.stateModel.updateState({ isSubmittable: true });
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.buttonTextService.updateButtonText('Submit');

    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Function to be called by ngOnDestroy to handle any asynchronous operations.
   */
  private async asyncNgOnDestroy(): Promise<void> {
    await this.devicesService.abortExams(this.device!);
  }

  async nextStep(): Promise<void> {
    switch (this.currentStep) {
      case 'Ready':
        await this.playTrial(this.currentTrial);
        this.instructions = 'Select the word prompted by the voice';
        this.currentStep = 'Exam';
        this.stateModel.updateState({ isSubmittable: false });
        this.buttonTextService.updateButtonText('Next');
        break;
      case 'Exam': {
        this.stateModel.updateState({ isSubmittable: false });
        this.saveResponse();
        const nbTrialsCompleted = this.results.currentPage.response.length;
        if (this.trialList.length > 0) {
          this.pctComplete = (nbTrialsCompleted / this.nbTrials) * 100;
          this.currentTrial = this.trialList.shift()!;
          this.isCorrect = null;
          this.feedbackMessage = ' ';
          this.selectedResponseIndex = null;
          await this.waitForReadyState();
          await this.playTrial(this.currentTrial);
        } else {
          this.isAutoSubmit = false;
          this.finishExam();
        }
        break;
      }
      case 'Results':
        this.examService.submitDefault();
        break;
    }
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async choose(index: number) {
    this.selectedResponseIndex = index;
    if (index === this.currentTrial.answer - 1) {
      this.isCorrect = true;
      this.feedbackMessage = 'Correct!';
    } else {
      this.isCorrect = false;
      const correctWord = this.currentTrial.choices[this.currentTrial.answer - 1];
      this.feedbackMessage = `The correct word was '${correctWord}'`;
    }

    if (this.isAutoSubmit) {
      await this.delay(this.waitingMs);
      this.stateModel.updateState({ isSubmittable: false });
      this.nextStep();
    } else {
      this.stateModel.updateState({ isSubmittable: true });
    }
  }

  async finishExam() {
    if (this.showResults) {
      this.currentStep = 'Results';
      this.instructions = 'Results';
      this.mrtResults = this.gradeExam();
      this.buttonTextService.updateButtonText('Finish');
    } else {
      this.examService.submitDefault();
    }
    await this.devicesService.abortExams(this.device!);
  }

  async pauseExam() {
    this.isPaused = !this.isPaused;
    this.isAutoSubmit = !this.isAutoSubmit;
    if (this.isPaused) {
      this.isPausedText = 'Resume';
    } else {
      this.isPausedText = 'Pause';
    }
  }

  getButtonClass(index: number): string {
    if (this.selectedResponseIndex === null) {
      return '';
    }
    if (index === this.currentTrial.answer - 1) {
      return 'correct';
    }
    if (index === this.selectedResponseIndex) {
      return 'incorrect';
    }
    return '';
  }

  getVisibilityStyle(): string {
    return this.isPaused ? 'visible' : 'hidden';
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  private initializeResponseArea(responseArea: MrtExamInterface) {
    this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
    this.showResults = responseArea.showResults ?? this.showResults;
    this.outputChannel = responseArea.outputChannel ?? mrtSchema.properties.outputChannel.default;
    this.randomizeTrials = responseArea.randomizeTrials ?? mrtSchema.properties.randomizeTrials.default;
    this.nbTrials = responseArea.trialList!.length;
    this.trialList = responseArea.trialList!.slice();
    if (this.randomizeTrials) shuffleArray(this.trialList);
    this.currentTrial = this.trialList.shift()!;
    this.resultsModel.updateCurrentPage({ response: [] });
  }

  private async setupDevice(updatedResponseArea: MrtExamInterface) {
    this.device = await this.devicesService.getDeviceOrDefault(updatedResponseArea.tabsintId, this.allowableDevices);
    if (!this.device) {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up MRT exam');
    } else if (this.devicesService.isDeviceMessagePending(this.device, false)) {
      await this.devicesService.deviceMessagePendingError();
      this.logger.error('Error setting up MRT exam: Device message pending');
    } else {
      await this.beginExam();
    }
  }

  private async beginExam() {
    if (this.device) {
      const examProperties = {
        OutputChannel: this.outputChannel,
      };
      await this.devicesService.queueExam(this.device, 'MrtExam', examProperties);
    } else {
      await this.devicesService.deviceNotFound();
      this.logger.error('Error setting up MRT exam');
    }
  }

  private async playTrial(mrtTrial: MrtTrialInterface) {
    const examProperties = {
      SoundFileName: mrtTrial.filename,
      LeveldBSpl: mrtTrial.leveldBSpl,
      UseMetaRMS: mrtTrial.useMeta,
    };
    await this.devicesService.examSubmission(this.device!, examProperties);
  }

  private async waitForReadyState(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const pollResults = async () => {
        try {
          const resp = await this.devicesService.requestResults(this.device!);
          if (resp?.msg && typeof resp.msg[1] === 'object' && resp.msg[1] !== null && 'State' in resp.msg[1]) {
            if (resp.msg[1].State === 'PLAYING') {
              setTimeout(pollResults, 500);
            } else if (resp.msg[1].State === 'READY') {
              resolve();
            } else {
              this.logger.debug('In mrt-exam.component.ts waitForReadyState, unknown result state: ' + JSON.stringify(resp?.msg[1]));
              reject(new Error('Unknown result state: ' + resp.msg[1].State));
            }
          }
        } catch (error) {
          this.logger.error('Error in waitForReadyState: ' + error);
          reject(error);
        }
      };
      pollResults();
    });
  }

  private saveResponse() {
    this.trialListResults.push({
      ...this.currentTrial,
      userResponseIndex: this.selectedResponseIndex!,
      isCorrect: this.isCorrect!,
    });
    this.resultsModel.updateCurrentPage({ response: this.trialListResults });
  }

  private gradeExam() {
    // Group the trial list results by their SNR values
    return Object.values(
      this.trialListResults.reduce(
        (acc, trial) => {
          const snr = trial.SNR;
          if (!acc[snr]) {
            // Initialize the group if it doesn't exist
            acc[snr] = {
              snr: snr,
              nbTrials: 0,
              nbTrialsCorrect: 0,
              pctCorrect: 0,
              trialList: [],
            };
          }

          // Update the group's statistics
          acc[snr].trialList.push(trial);
          acc[snr].nbTrials++;
          if (trial.isCorrect) {
            acc[snr].nbTrialsCorrect++;
          }
          acc[snr].pctCorrect = parseFloat(((acc[snr].nbTrialsCorrect / acc[snr].nbTrials) * 100).toFixed(1));

          return acc;
        },
        {} as Record<number, MrtResultsInterface>
      )
    );
  }
}
