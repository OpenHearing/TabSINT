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
import { DeviceType } from '../../../../utilities/constants';
import { getCurrentDatetime } from '../../../../utilities/exam-helper-functions';
import { hintSchema } from '../../../../../schema/response-areas/hint.schema';
import {
  HintDeviceResultsInterface,
  HintExamPropertiesInterface,
  HintPresentationResultInterface,
  HintResponseAreaInterface,
  HintResponseInterface,
} from './hint.interface';

const EXAM_NAME = 'HINT';
const SUBMISSION_NAME = 'HINT$Submission';
const POLL_INTERVAL_MS = 500;
const SUBMIT_LOCKOUT_MS = 3000;
const FEEDBACK_DELAY_MS = 200;
const LIST_NUMBER_MAX = 12;
const TEMP_SPACER = '$SPACER';

/**
 * Device exam states reported by the CHA in the "HINT" results.
 */
const enum ExamProgress {
  Running = 0,
  Complete = 2,
}

@Component({
  selector: 'app-hint-exam',
  templateUrl: './hint.component.html',
  styleUrl: './hint.component.css',
})
export class HintComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);

  // Configuration
  private readonly allowableDevices = [DeviceType.Wahts];
  examInstructions: string | undefined;
  numberOfPresentations = 20;

  // Exam UI state
  device: IDevice | undefined;
  listOfWords: string[] = [];
  response: number[] = [];
  wordsDisabled = true;
  presentationCount = 0;

  // Internal state
  private responseArea: HintResponseAreaInterface | undefined;
  private examProperties: HintExamPropertiesInterface = {};
  private presentations: HintPresentationResultInterface[] = [];
  private correctPresentations = 0;
  private currentPresentationId: string | number | undefined;
  private responseStartTime = '';
  private initialized = false;
  private examActive = false;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;
  private lockoutTimeout: ReturnType<typeof setTimeout> | undefined;
  private feedbackTimeout: ReturnType<typeof setTimeout> | undefined;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'hintResponseArea') {
        this.setupResponseArea(updatedPage.responseArea as HintResponseAreaInterface);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.clearTimers();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Initialize the response area from the protocol definition and begin the exam.
   * @param responseArea The HINT response area definition.
   */
  private async setupResponseArea(responseArea: HintResponseAreaInterface): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.responseArea = responseArea;
    this.examInstructions = responseArea.examInstructions;
    this.examProperties = { ...(responseArea.examProperties ?? {}) };
    this.numberOfPresentations =
      this.examProperties.NumberOfPresentations ?? hintSchema.properties.examProperties.properties.NumberOfPresentations.default;
    this.examProperties.NumberOfPresentations = this.numberOfPresentations;

    await this.setupDevice(responseArea);
    if (!this.device) {
      return;
    }
    await this.startExam();
  }

  /**
   * Resolve the WAHTS device used to run the exam.
   * @param responseArea The HINT response area definition.
   */
  private async setupDevice(responseArea: HintResponseAreaInterface): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error('HINT exam: no WAHTS device available.');
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
    // Submit advances each sentence rather than the whole page while the exam runs.
    this.examService.submit = () => this.processSelectedWords();

    if (this.examProperties.ListNumber === undefined) {
      this.examProperties.ListNumber = Math.ceil(Math.random() * LIST_NUMBER_MAX);
      this.logger.debug('CHA HINT exam called without a ListNumber defined, using ' + this.examProperties.ListNumber);
    }

    this.clearSelection();
    this.resetResults();
    this.resetSubmitButton();
    this.presentationCount = 0;
    this.correctPresentations = 0;

    await this.devicesService.abortExams(this.device);
    await this.devicesService.queueExam(this.device, EXAM_NAME, this.examProperties);
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
    const results = await this.requestHintResults();
    if (results) {
      this.presentationHandler(results);
    }
  }

  /**
   * Handle the device results. While the exam is running a sentence is shown for scoring;
   * once complete the aggregate results are saved and the page advances.
   * @param results The latest results from the device.
   */
  private presentationHandler(results: HintDeviceResultsInterface): void {
    if (results.State === ExamProgress.Running) {
      this.clearSelection();
      this.resetSubmitButton();
      this.currentPresentationId = results.presentationId;
      this.listOfWords = this.btnSplitSpacer((results.CurrentSentence ?? '').trim())
        .replace(/\s+/g, ' ')
        .split(TEMP_SPACER);
      this.wordsDisabled = false;
      this.presentationCount = results.CurrentSentenceIndex ?? this.presentationCount + 1;
    } else if (results.State === ExamProgress.Complete) {
      this.examActive = false;
      this.wordsDisabled = true;
      const response: HintResponseInterface = {
        presentations: this.presentations,
        presentationCount: this.presentationCount + 1,
        correctPresentationCount: this.correctPresentations,
      };
      this.resultsModel.updateCurrentPage({ response });
      this.examService.submit = this.examService.submitDefault.bind(this.examService);
      this.stateModel.updateState({ isSubmittable: true });
      this.examService.submitDefault();
    } else {
      // The device has not produced a usable presentation yet; try again shortly.
      this.pollTimeout = setTimeout(() => this.getPresentationInfo(), POLL_INTERVAL_MS);
    }
  }

  /**
   * Parse a sentence into word tokens, keeping parenthesised groups together as a single
   * token. Spaces outside parentheses become token boundaries.
   * @param sentence The raw sentence from the device.
   * @returns The sentence with token boundaries marked by the temporary spacer.
   */
  private btnSplitSpacer(sentence: string): string {
    let result = '';
    let current = '';
    let parenthesis = 0;
    for (const char of sentence) {
      if (char === '(') {
        parenthesis++;
        current += '(';
      } else if (char === ')' && parenthesis > 0) {
        parenthesis--;
        current += ')';
      } else if (char === ' ' && parenthesis === 0) {
        result += current + TEMP_SPACER;
        current = '';
      } else {
        current += char;
      }
    }
    if (current !== '') {
      result += current;
    }
    return result;
  }

  /**
   * Grade the selected words, record the presentation result, then submit to the device.
   * Invoked by the page submit button while the exam is running.
   */
  processSelectedWords(): void {
    if (!this.examActive || this.wordsDisabled) {
      return;
    }
    this.wordsDisabled = true;
    this.stateModel.updateState({ isSubmittable: false });

    // The first word is the least significant bit of the response bitmask.
    let correctWords = 0;
    const selectedWords: string[] = [];
    this.response.forEach(index => {
      correctWords += Math.pow(2, index);
      selectedWords.push(this.listOfWords[index]);
    });

    const numberCorrect = this.response.length;
    const wordCount = this.listOfWords.length;
    if (numberCorrect === wordCount) {
      this.correctPresentations += 1;
    }

    const presentation: HintPresentationResultInterface = {
      presentationId: this.currentPresentationId,
      responseStartTime: this.responseStartTime,
      sentence: [...this.listOfWords],
      response: [...this.response],
      selectedWords,
      numberCorrect,
      wordCount,
      correct: numberCorrect === wordCount,
      responseToCha: correctWords,
    };
    this.presentations.push(presentation);
    this.resultsModel.updateCurrentPage({ response: { presentations: this.presentations } as HintResponseInterface });

    this.feedbackTimeout = setTimeout(() => this.submitWords(correctWords, wordCount), FEEDBACK_DELAY_MS);
  }

  /**
   * Send the graded response to the device and request the next presentation.
   * @param correctWords The bitmask of words the subject heard correctly.
   * @param wordCount The total number of words in the sentence.
   */
  private async submitWords(correctWords: number, wordCount: number): Promise<void> {
    if (!this.device) {
      return;
    }
    try {
      await this.devicesService.examSubmission(this.device, { name: SUBMISSION_NAME, CorrectWords: correctWords, WordCount: wordCount });
      this.resetResults();
      await this.getPresentationInfo();
    } catch (error) {
      this.logger.error('HINT exam: error submitting response: ' + error);
      this.examActive = false;
    }
  }

  /**
   * Reset the working result fields for a new presentation.
   */
  private resetResults(): void {
    this.responseStartTime = getCurrentDatetime();
  }

  /**
   * Disable the submit button briefly so the subject can hear the sentence before scoring.
   */
  private resetSubmitButton(): void {
    this.stateModel.updateState({ isSubmittable: false });
    if (this.lockoutTimeout) {
      clearTimeout(this.lockoutTimeout);
    }
    this.lockoutTimeout = setTimeout(() => {
      this.stateModel.updateState({ isSubmittable: true });
    }, SUBMIT_LOCKOUT_MS);
  }

  /**
   * Whether the word at the given index is currently selected.
   * @param wordIndex The index of the word.
   */
  hintChosen(wordIndex: number): boolean {
    return this.response.includes(wordIndex);
  }

  /**
   * Toggle selection of the word at the given index.
   * @param wordIndex The index of the word.
   */
  toggleWord(wordIndex: number): void {
    if (this.wordsDisabled) {
      return;
    }
    const index = this.response.indexOf(wordIndex);
    if (index < 0) {
      this.response.push(wordIndex);
    } else {
      this.response.splice(index, 1);
    }
  }

  /**
   * Select every word in the current sentence.
   */
  selectAllWords(): void {
    this.response = this.listOfWords.map((_word, index) => index);
  }

  /**
   * Clear the current word selection.
   */
  clearSelection(): void {
    this.response = [];
  }

  /**
   * Request results from the device and extract the HINT results payload.
   * @returns The results, or undefined if the response was not usable.
   */
  private async requestHintResults(): Promise<HintDeviceResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device);
    if (resp?.msg && typeof resp.msg[1] === 'object' && resp.msg[1] !== null) {
      return resp.msg[1] as HintDeviceResultsInterface;
    }
    this.logger.debug('HINT exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
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
   * Clear any pending poll/lockout/feedback timers.
   */
  private clearTimers(): void {
    [this.pollTimeout, this.lockoutTimeout, this.feedbackTimeout].forEach(timer => {
      if (timer) {
        clearTimeout(timer);
      }
    });
    this.pollTimeout = undefined;
    this.lockoutTimeout = undefined;
    this.feedbackTimeout = undefined;
  }
}
