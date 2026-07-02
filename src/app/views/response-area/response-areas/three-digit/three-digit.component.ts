import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageModel } from '../../../../models/page/page.service';
import { StateModel } from '../../../../models/state/state.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ExamService } from '../../../../controllers/exam.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { getCurrentDatetime } from '../../../../utilities/exam-helper-functions';
import { isThreeDigitResultsResponse } from '../../../../guards/type.guard';
import { threeDigitSchema } from '../../../../../schema/response-areas/three-digit.schema';
import {
  ThreeDigitDeviceResultsInterface,
  ThreeDigitExamPropertiesInterface,
  ThreeDigitPresentationResultInterface,
  ThreeDigitResponseAreaInterface,
  ThreeDigitResponseInterface,
} from './three-digit.interface';

const EXAM_NAME = 'ThreeDigit';
const SUBMISSION_NAME = 'ThreeDigit$Submission';
const POLL_INTERVAL_MS = 500;

/** Schema property definitions used to seed parameters with their defaults at construction. */
const tdSchema = threeDigitSchema.properties;
const examPropSchema = threeDigitSchema.properties.examProperties.properties;

/**
 * Device exam states reported by the CHA in the "ThreeDigit" results.
 */
const enum ExamProgress {
  Running = 0,
  WaitingForResult = 1,
  Complete = 2,
}

@Component({
  selector: 'app-three-digit-exam',
  templateUrl: './three-digit.component.html',
  styleUrl: './three-digit.component.css',
})
export class ThreeDigitComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);

  DeviceStatus = DeviceStatus;

  // Configuration (seeded with schema defaults at construction, overridden by the protocol)
  private readonly allowableDevices = [DeviceType.Wahts];
  autoSubmit = tdSchema.autoSubmit.default;
  autoSubmitPresentation = tdSchema.autoSubmitPresentation.default;
  private feedbackEnabled = tdSchema.feedback.default;
  private feedbackDelay = tdSchema.feedbackDelay.default;
  private keypadDelay = tdSchema.keypadDelay.default;
  examInstructions: string | undefined;
  nPresentations = examPropSchema.nPresentations.default;

  // Exam UI state
  device: IDevice | undefined;
  presentationCount = 0;
  digitsDisabled = true;
  showFeedback = false;
  examComplete = false;
  userResponse: string[] = [];
  digitCorrect: boolean[] = [false, false, false];

  // Internal state
  private responseArea: ThreeDigitResponseAreaInterface | undefined;
  private examProperties: ThreeDigitExamPropertiesInterface = {
    nPresentations: examPropSchema.nPresentations.default,
    warmupN: examPropSchema.warmupN.default,
    targetType: examPropSchema.targetType.default,
    maskerType: examPropSchema.maskerType.default,
    warmupMasker: examPropSchema.warmupMasker.default,
    initialSNR: examPropSchema.initialSNR.default,
    fixedLevel: examPropSchema.fixedLevel.default,
    fixedMaterial: examPropSchema.fixedMaterial.default,
    correctStep: examPropSchema.correctStep.default,
    incorrectStep: examPropSchema.incorrectStep.default,
    warmupCorrectStep: examPropSchema.warmupCorrectStep.default,
    warmupIncorrectStep: examPropSchema.warmupIncorrectStep.default,
    ear: examPropSchema.ear.default,
  };
  private presentations: ThreeDigitPresentationResultInterface[] = [];
  private currentDigits: string[] = [];
  private currentPresentationId: number | undefined;
  private currentPresentation: string | undefined;
  private currentSNR: number | undefined;
  private currentMasker: 'positivePhase' | 'negativePhase' | '2babble' | undefined;
  private currentDeviceCount: number | undefined;
  private responseStartTime = '';
  private readyToProcess = false;
  private initialized = false;
  private examActive = false;
  private keypadTimeout: ReturnType<typeof setTimeout> | undefined;
  private processTimeout: ReturnType<typeof setTimeout> | undefined;
  private feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'threeDigitResponseArea') {
        this.setupResponseArea(updatedPage.responseArea as ThreeDigitResponseAreaInterface);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.clearTimers();
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Initialize the response area from the protocol definition and begin the exam.
   * @param responseArea The three digit response area definition.
   */
  private async setupResponseArea(responseArea: ThreeDigitResponseAreaInterface): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.responseArea = responseArea;
    // Overlay the protocol's values on top of the schema defaults seeded at construction.
    this.autoSubmit = responseArea.autoSubmit ?? this.autoSubmit;
    this.autoSubmitPresentation = responseArea.autoSubmitPresentation ?? this.autoSubmitPresentation;
    this.feedbackEnabled = responseArea.feedback ?? this.feedbackEnabled;
    this.feedbackDelay = responseArea.feedbackDelay ?? this.feedbackDelay;
    this.keypadDelay = responseArea.keypadDelay ?? this.keypadDelay;
    this.examInstructions = responseArea.examInstructions;
    this.examProperties = { ...this.examProperties, ...(responseArea.examProperties ?? {}) };
    this.nPresentations = this.examProperties.nPresentations ?? this.nPresentations;
    this.examProperties.nPresentations = this.nPresentations;

    await this.setupDevice(responseArea);
    if (!this.device) {
      return;
    }
    await this.startExam();
  }

  /**
   * Resolve the WAHTS device used to run the exam.
   * @param responseArea The three digit response area definition.
   */
  private async setupDevice(responseArea: ThreeDigitResponseAreaInterface): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error('Three digit exam: no WAHTS device available.');
    }
  }

  /**
   * Queue the exam on the device and request the first presentation.
   */
  async startExam(): Promise<void> {
    if (!this.device) {
      await this.devicesService.deviceNotFound();
      return;
    }
    this.stateModel.updateState({ isSubmittable: false });
    await this.devicesService.abortExams(this.device);
    await this.devicesService.queueExam(this.device, EXAM_NAME, this.examProperties);
    this.examActive = true;
    this.resetPresentation();
    await this.getPresentationInfo();
  }

  /**
   * Request the current presentation from the device and route it through the handler.
   */
  private async getPresentationInfo(): Promise<void> {
    const results = await this.requestThreeDigitResults();
    if (results) {
      this.presentationHandler(results);
    }
  }

  /**
   * Handle the device results for the current presentation. While the device is running or
   * waiting for a response the entered digits can be graded; once complete the page is
   * marked submittable.
   * @param results The latest results from the device.
   */
  private presentationHandler(results: ThreeDigitDeviceResultsInterface): void {
    if (results.State === ExamProgress.Running || results.State === ExamProgress.WaitingForResult) {
      this.currentDigits = String(results.currentDigits ?? '').split('');
      this.currentPresentationId = results.presentationId;
      this.currentPresentation = results.currentPresentation;
      this.currentSNR = results.currentSNR;
      this.currentMasker = results.currentMasker;
      this.currentDeviceCount = results.presentationCount;
      this.readyToProcess = true;
    } else if (results.State === ExamProgress.Complete) {
      this.examActive = false;
      this.examComplete = true;
      this.digitsDisabled = true;
      const response: ThreeDigitResponseInterface = {
        presentations: this.presentations,
        results,
      };
      this.resultsModel.updateCurrentPage({ response });
      this.stateModel.updateState({ isSubmittable: true });
      if (this.autoSubmit) {
        this.examService.submitDefault();
      }
    } else {
      // The device has not produced a usable presentation yet; try again shortly.
      this.processTimeout = setTimeout(() => this.getPresentationInfo(), POLL_INTERVAL_MS);
    }
  }

  /**
   * Add a digit to the current response. When the third digit is entered and presentations
   * auto-submit, the response is graded and submitted automatically.
   * @param digit The digit pressed on the keypad.
   */
  addDigit(digit: number): void {
    if (this.digitsDisabled || this.userResponse.length >= 3) {
      return;
    }
    this.userResponse.push(digit.toString());
    if (this.userResponse.length === 3 && this.autoSubmitPresentation) {
      this.processDigits();
    }
  }

  /**
   * Clear the entered digits and any feedback shown for the current presentation.
   */
  resetKeypad(): void {
    this.userResponse = [];
    this.digitCorrect = [false, false, false];
    this.showFeedback = false;
  }

  /**
   * Grade the entered digits against the presentation answer once the device is ready,
   * show feedback, then submit the response after the configured delay.
   */
  processDigits(): void {
    if (!this.examActive) {
      return;
    }
    if (!this.readyToProcess) {
      this.processTimeout = setTimeout(() => this.processDigits(), POLL_INTERVAL_MS);
      return;
    }
    this.requestThreeDigitResults()
      .then(results => {
        if (!results) {
          return;
        }
        if (results.State === ExamProgress.Running) {
          // Presentation still playing; ask again shortly.
          this.processTimeout = setTimeout(() => this.processDigits(), POLL_INTERVAL_MS);
        } else if (results.State === ExamProgress.WaitingForResult) {
          this.logger.debug('CHA processing entered digits: ' + this.userResponse.join(''));
          this.digitsDisabled = true;
          this.readyToProcess = false;
          this.showFeedback = this.feedbackEnabled;
          this.userResponse.forEach((digit, index) => {
            this.digitCorrect[index] = digit === this.currentDigits[index];
          });
          // Allow the correct answers to show briefly before submitting results.
          this.feedbackTimeout = setTimeout(() => this.submitDigits(), this.feedbackDelay);
        }
      })
      .catch(error => {
        this.logger.error('Three digit exam: error processing digits: ' + error);
        this.examActive = false;
      });
  }

  /**
   * Record the graded presentation, push the score back to the device, and start the next
   * presentation.
   */
  private async submitDigits(): Promise<void> {
    if (!this.device) {
      return;
    }
    const numberCorrect = this.digitCorrect.filter(correct => correct).length;
    const presentation: ThreeDigitPresentationResultInterface = {
      presentationId: this.currentPresentationId,
      presentationCount: this.currentDeviceCount,
      responseStartTime: this.responseStartTime,
      currentPresentation: this.currentPresentation,
      response: [...this.userResponse],
      currentDigits: [...this.currentDigits],
      currentSNR: this.currentSNR,
      currentMasker: this.currentMasker,
      numberCorrect,
      numberIncorrect: this.digitCorrect.length - numberCorrect,
      eachCorrect: [...this.digitCorrect],
      correct: this.digitCorrect.every(correct => correct),
    };
    this.presentations.push(presentation);
    this.resultsModel.updateCurrentPage({ response: { presentations: this.presentations } as ThreeDigitResponseInterface });

    try {
      await this.devicesService.examSubmission(this.device, { name: SUBMISSION_NAME, nCorrect: numberCorrect });
      this.resetPresentation();
      await this.getPresentationInfo();
    } catch (error) {
      this.logger.error('Three digit exam: error submitting digits: ' + error);
      this.examActive = false;
    }
  }

  /**
   * Reset the keypad for a new presentation and schedule its activation.
   */
  private resetPresentation(): void {
    this.resetKeypad();
    this.responseStartTime = getCurrentDatetime();
    this.keypadTimeout = setTimeout(() => this.activateKeypad(), this.keypadDelay);
  }

  /**
   * Enable the keypad and advance the displayed presentation counter.
   */
  private activateKeypad(): void {
    this.digitsDisabled = false;
    this.presentationCount += 1;
  }

  /**
   * Request results from the device and extract the three digit results payload.
   * @returns The results, or undefined if the response was not usable.
   */
  private async requestThreeDigitResults(): Promise<ThreeDigitDeviceResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device);
    if (isThreeDigitResultsResponse(resp)) {
      return resp.msg[1];
    }
    this.logger.debug('Three digit exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Abort any running exam on the device and stop polling.
   */
  private stopExam(): void {
    this.examActive = false;
    this.clearTimers();
    if (this.device) {
      this.devicesService.abortExams(this.device);
    }
  }

  /**
   * Clear any pending keypad/poll/feedback timers.
   */
  private clearTimers(): void {
    [this.keypadTimeout, this.processTimeout, this.feedbackTimeout].forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.keypadTimeout = undefined;
    this.processTimeout = undefined;
    this.feedbackTimeout = undefined;
  }
}
