import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageModel } from '../../../../models/page/page.service';
import { StateModel } from '../../../../models/state/state.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ExamService } from '../../../../controllers/exam.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Logger } from '../../../../services/logger.service';
import { PageInterface } from '../../../../models/page/page.interface';
import { DeviceType } from '../../../../utilities/constants';
import { getCurrentDatetime } from '../../../../utilities/exam-helper-functions';
import { isWahtsResultsResponse } from '../../../../guards/type.guard';
import { sswSchema } from '../../../../../schema/response-areas/ssw.schema';
import {
  SswDeviceExamPropertiesInterface,
  SswDeviceResultsInterface,
  SswDeviceState,
  SswLanguage,
  SswPresentationResultInterface,
  SswResponseAreaInterface,
  SswResponseInterface,
} from './ssw.interface';

const EXAM_NAME = 'SSW';
const SUBMISSION_NAME = 'SSW$Submission';
const POLL_INTERVAL_MS = 500;
const FEEDBACK_DELAY_MS = 200;
const EAR_RIGHT = 'right';

/** Schema property defaults used to seed exam parameters at construction. */
const examPropSchema = sswSchema.properties.examProperties.properties;

/** Ordered language list; the CHA expects the zero-based index rather than the name. */
const EXAM_LANGUAGES: SswLanguage[] = Object.values(SswLanguage);

@Component({
  selector: 'app-ssw-exam',
  templateUrl: './ssw.component.html',
  styleUrl: './ssw.component.css',
})
export class SswComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);

  // Configuration (seeded with schema defaults at construction, overridden by the protocol)
  private readonly allowableDevices = [DeviceType.Wahts];
  examInstructions: string | undefined;
  numberOfPresentations = examPropSchema.nPresentations.default;
  autoSubmit = sswSchema.properties.autoSubmit.default;

  // Exam UI state
  deviceId: string | undefined;
  listOfWords: string[] = [];
  /** Order (1-based) in which each word was repeated; 0 marks a missed word. */
  response: number[] = [];
  orderValues: number[] = [];
  wordsDisabled = true;
  presentationCount = 1;
  isRightEarFirst = true;
  notes = '';
  examComplete = false;
  readonly presentations: SswPresentationResultInterface[] = [];

  // Internal state
  private examProperties: SswDeviceExamPropertiesInterface = {
    language: EXAM_LANGUAGES.indexOf(examPropSchema.language.default),
    randomOrder: examPropSchema.randomOrder.default,
    nPresentations: examPropSchema.nPresentations.default,
    groupedPresentations: [...examPropSchema.groupedPresentations.default],
    playCarrier: examPropSchema.playCarrier.default,
    playHiss: examPropSchema.playHiss.default,
    presentationLevel: examPropSchema.presentationLevel.default,
    firstEar: examPropSchema.firstEar.default,
    waitDur: examPropSchema.waitDur.default,
  };
  correctPresentations = 0;
  private currentPresentationId: string | number | undefined;
  private responseStartTime = '';
  private responseStartMs = 0;
  private newPresentation = true;
  private initialized = false;
  private examActive = false;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;
  private feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'sswResponseArea') {
        this.setupResponseArea(updatedPage.responseArea as SswResponseAreaInterface);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Initialize the response area from the protocol definition and begin the exam.
   * @param responseArea The SSW response area definition.
   */
  private async setupResponseArea(responseArea: SswResponseAreaInterface): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.examInstructions = responseArea.examInstructions;
    // Overlay the protocol's values on top of the schema defaults seeded at construction.
    this.autoSubmit = responseArea.autoSubmit ?? this.autoSubmit;
    const { language, ...protocolProperties } = responseArea.examProperties ?? {};
    this.examProperties = { ...this.examProperties, ...protocolProperties };
    if (language !== undefined) {
      this.examProperties.language = Math.max(EXAM_LANGUAGES.indexOf(language), 0);
    }
    this.numberOfPresentations = this.examProperties.nPresentations ?? this.numberOfPresentations;

    await this.setupDevice(responseArea);
    if (!this.deviceId) {
      return;
    }
    await this.startExam();
  }

  /**
   * Resolve the WAHTS device used to run the exam.
   * @param responseArea The SSW response area definition.
   */
  private async setupDevice(responseArea: SswResponseAreaInterface): Promise<void> {
    this.deviceId = await this.devicesService.confirmSingleDeviceId(responseArea.tabsintId, this.allowableDevices);
    if (!this.deviceId) {
      this.logger.error('SSW exam: no WAHTS device available.');
    }
  }

  /**
   * Queue the exam on the device and request the first presentation.
   */
  async startExam(): Promise<void> {
    if (!this.deviceId) {
      await this.devicesService.deviceNotFound();
      return;
    }
    // Submit grades each presentation rather than the whole page while the exam runs.
    this.examService.submit = async () => this.processSelectedData();

    this.presentationCount = 1;
    this.isRightEarFirst = true;
    this.correctPresentations = 0;
    this.presentations.length = 0;
    this.examComplete = false;
    this.resetResults();

    await this.devicesService.abortExams(this.deviceId);
    await this.devicesService.queueExam(this.deviceId, EXAM_NAME, this.examProperties);
    this.examActive = true;
    await this.getPresentationInfo();
  }

  /**
   * Request the current presentation from the device and route it through the handler.
   */
  private async getPresentationInfo(): Promise<void> {
    if (!this.examActive) {
      return;
    }
    const results = await this.requestSswResults();
    if (results && this.examActive) {
      this.presentationHandler(results);
    }
  }

  /**
   * Handle the device results. While a presentation plays its words are shown for scoring;
   * once the device waits for a result the page becomes submittable; once the exam is done
   * the aggregate results are saved.
   * @param results The latest results from the device.
   */
  private presentationHandler(results: SswDeviceResultsInterface): void {
    if (results.State === SswDeviceState.Done) {
      this.completeExam(results);
      return;
    }
    if (this.newPresentation && results.currentPresentation) {
      this.loadPresentation(results);
    }
    if (results.State === SswDeviceState.WaitingForResult) {
      this.wordsDisabled = false;
      this.stateModel.updateState({ isSubmittable: true });
      return;
    }
    // Still loading or playing; request results again shortly.
    this.pollTimeout = setTimeout(() => this.getPresentationInfo(), POLL_INTERVAL_MS);
  }

  /**
   * Show a newly started presentation with every word pre-marked as correct and in order.
   * @param results The device results describing the presentation.
   */
  private loadPresentation(results: SswDeviceResultsInterface): void {
    this.newPresentation = false;
    this.currentPresentationId = results.presentationId;
    this.listOfWords = (results.currentPresentation ?? '').trim().split(/\s+/);
    this.orderValues = this.listOfWords.map((_word, index) => index + 1);
    this.selectAll();
    this.isRightEarFirst = results.firstEar === EAR_RIGHT;
    this.presentationCount = results.presentationNumber ?? this.presentationCount;
    this.stateModel.updateState({ isSubmittable: false });
  }

  /**
   * Save the aggregate results and hand control back to the page once the device reports DONE.
   * @param results The final device results.
   */
  private completeExam(results: SswDeviceResultsInterface): void {
    this.examActive = false;
    this.examComplete = true;
    this.wordsDisabled = true;
    const response: SswResponseInterface = {
      presentations: this.presentations,
      presentationCount: this.presentations.length,
      correctPresentationCount: this.correctPresentations,
      results,
    };
    this.resultsModel.updateCurrentPage({ response });
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.stateModel.updateState({ isSubmittable: true });
    if (this.autoSubmit) {
      this.examService.submitDefault();
    }
  }

  /**
   * Grade the selected order, record the presentation result, then submit to the device.
   * Invoked by the page submit button while the exam is running.
   */
  processSelectedData(): void {
    if (!this.examActive || this.wordsDisabled) {
      return;
    }
    this.wordsDisabled = true;
    this.stateModel.updateState({ isSubmittable: false });

    const correct = this.response.join() === this.orderValues.join();
    if (correct) {
      this.correctPresentations += 1;
    }
    const presentation: SswPresentationResultInterface = {
      presentationId: this.currentPresentationId,
      presentationNumber: this.presentationCount,
      responseStartTime: this.responseStartTime,
      responseElapTimeMS: Date.now() - this.responseStartMs,
      firstEar: this.isRightEarFirst ? EAR_RIGHT : 'left',
      words: [...this.listOfWords],
      response: [...this.response],
      numberCorrect: this.response.filter(value => value !== 0).length,
      wordCount: this.listOfWords.length,
      correct,
      responseToCha: [...this.response],
      notes: this.notes,
    };
    this.presentations.push(presentation);
    this.resultsModel.updateCurrentPage({ response: { presentations: this.presentations } as SswResponseInterface });

    // Leave the graded answers visible briefly before moving on.
    this.feedbackTimeout = setTimeout(() => this.submitUserResults(presentation.responseToCha), FEEDBACK_DELAY_MS);
  }

  /**
   * Send the graded order to the device and request the next presentation.
   * @param correctWords The order value for each word (0 when missed).
   */
  private async submitUserResults(correctWords: number[]): Promise<void> {
    if (!this.deviceId) {
      return;
    }
    try {
      await this.devicesService.examSubmission(this.deviceId, { name: SUBMISSION_NAME, CorrectWords: correctWords });
      this.resetResults();
      await this.getPresentationInfo();
    } catch (error) {
      this.logger.error('SSW exam: error submitting response: ' + error);
      this.examActive = false;
    }
  }

  /**
   * Reset the working result fields for a new presentation.
   */
  private resetResults(): void {
    this.newPresentation = true;
    this.wordsDisabled = true;
    this.notes = '';
    this.responseStartTime = getCurrentDatetime();
    this.responseStartMs = Date.now();
    this.stateModel.updateState({ isSubmittable: false });
  }

  /**
   * Whether the word at the given index was repeated in the given order.
   * @param wordIndex The index of the word.
   * @param orderValue The 1-based order value.
   */
  hasOrder(wordIndex: number, orderValue: number): boolean {
    return this.response[wordIndex] === orderValue;
  }

  /**
   * Whether the word at the given index is marked correct (repeated in some order).
   * @param wordIndex The index of the word.
   */
  isCorrect(wordIndex: number): boolean {
    return this.response[wordIndex] !== 0;
  }

  /**
   * Mark every word as repeated correctly and in order.
   */
  selectAll(): void {
    this.response = [...this.orderValues];
  }

  /**
   * Mark every word as missed.
   */
  clearSelection(): void {
    this.response = this.listOfWords.map(() => 0);
  }

  /**
   * Mark the word at the given index as missed.
   * @param wordIndex The index of the word.
   */
  removeOrderAtIndex(wordIndex: number): void {
    if (this.wordsDisabled) {
      return;
    }
    this.response[wordIndex] = 0;
  }

  /**
   * Record the order in which the word at the given index was repeated. Any other word holding
   * that order value is cleared so each order value is used at most once.
   * @param wordIndex The index of the word.
   * @param orderValue The 1-based order value.
   */
  setOrderAtIndex(wordIndex: number, orderValue: number): void {
    if (this.wordsDisabled) {
      return;
    }
    this.response = this.response.map(value => (value === orderValue ? 0 : value));
    this.response[wordIndex] = orderValue;
  }

  /**
   * Request results from the device and extract the SSW results payload.
   * @returns The results, or undefined if the response was not usable.
   */
  private async requestSswResults(): Promise<SswDeviceResultsInterface | undefined> {
    if (!this.deviceId) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.deviceId);
    if (isWahtsResultsResponse(resp)) {
      return resp.msg[1] as SswDeviceResultsInterface;
    }
    this.logger.debug('SSW exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Abort any running exam on the device and stop polling.
   */
  private stopExam(): void {
    this.examActive = false;
    this.clearTimers();
    if (this.deviceId) {
      this.devicesService.abortExams(this.deviceId);
    }
  }

  /**
   * Clear any pending poll/feedback timers.
   */
  private clearTimers(): void {
    [this.pollTimeout, this.feedbackTimeout].forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.pollTimeout = undefined;
    this.feedbackTimeout = undefined;
  }
}
