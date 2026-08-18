import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { PageModel } from '../../../../../models/page/page.service';
import { StateModel } from '../../../../../models/state/state.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { Logger } from '../../../../../services/logger.service';
import { PageInterface } from '../../../../../models/page/page.interface';
import { CurrentResults } from '../../../../../models/results/results.interface';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { DeviceType } from '../../../../../utilities/constants';
import { round } from '../../../../../utilities/math';
import { isStatusResponse } from '../../../../../guards/type.guard';
import { AudiometryResultsInterface } from '../../../../../interfaces/audiometry-results.interface';
import {
  AudiometryCombinedDatum,
  AudiometryExamProperties,
  AudiometryHideExamProps,
  AudiometryLevelUnits,
  AudiometryResponseArea,
  MaskingNoise,
  PlotProperties,
} from './audiometry.interface';
import { TrialProgressionPlotDataInterface } from '../trial-progression-plot/trial-progression-plot.interface';
import { assembleAudiometryResults } from './audiometry-combined-data.utility';

export enum ChaExamState {
  Ready = 1,
  Playing = 2,
}

export enum ResponseAreaState {
  Start = 'start',
  Exam = 'exam',
  Results = 'results',
  Notes = 'notes',
}

/** The subset of a per-exam response-area definition the shared exam lifecycle relies on. */
export interface AutomatedAudiometryResponseArea<TExamProperties> extends AudiometryResponseArea {
  tabsintId?: string;
  autoSubmit?: boolean;
  autoBegin?: boolean;
  examInstructions?: string;
  resultMainText?: string;
  resultSubText?: string;
  examProperties?: TExamProperties;
}

/**
 * Shared lifecycle for the automated single-device threshold audiometry exams (Bekesy-like,
 * Hughson-Westlake, BHAFT): device connection, status polling, results fetch/retry/notes
 * handling, submit, and building the combined audiogram from plotProperties.displayAudiogram.
 * Concrete exam types extend this and supply only what actually differs between them - see the
 * abstract members below.
 */
@Directive()
export abstract class AutomatedAudiometryExamComponentBase<
  TResults,
  TExamProperties extends AudiometryExamProperties,
  TResponseArea extends AutomatedAudiometryResponseArea<TExamProperties>,
>
  implements OnInit, OnDestroy
{
  protected readonly pageModel = inject(PageModel);
  protected readonly stateModel = inject(StateModel);
  protected readonly resultsModel = inject(ResultsModel);
  protected readonly examService = inject(ExamService);
  protected readonly devicesService = inject(DevicesService);
  protected readonly logger = inject(Logger);
  ResponseAreaState = ResponseAreaState;
  readonly round = round;

  protected readonly allowableDevices = [DeviceType.Wahts];

  /** Exam name passed to devicesService.queueExam, e.g. 'BekesyLike'. */
  protected abstract readonly examName: string;
  /** The page responseArea.type discriminant this exam type is configured under. */
  protected abstract readonly responseAreaType: TResponseArea['type'];
  /** Log-message prefix, e.g. 'Bekesy Like exam'. */
  protected abstract readonly examLabel: string;
  /** 'hold': button down/up map to distinct start/end events. 'tap': a single press auto-releases after a short delay. */
  protected abstract readonly pressMode: 'hold' | 'tap';

  // Configuration - concrete exam types provide their own schema-derived defaults by
  // re-declaring these fields with an initializer; base-then-derived field initializer order
  // means this simply overrides the neutral defaults below, same as each exam's flat
  // declarations did before this refactor.
  autoSubmit = false;
  autoBegin = false;
  useSoftwareButton = false;
  examInstructions: string | undefined;
  resultMainText = '';
  resultSubText = '';
  noResponseMessage: string | undefined;
  retryMessage: string | undefined;
  adminNotes = '';
  showProperties = false;
  hideExamProperties: AudiometryHideExamProps = AudiometryHideExamProps.Never;
  showMessageIfNoResponse = false;
  noResponseCustomMessage = '';
  repeatIfFailedOnce = false;
  getNotesIfFailedTwice = false;
  plotProperties: PlotProperties = { displayAudiogram: [], displayLevelProgression: false };
  maskingNoise: MaskingNoise | undefined;

  protected readonly retryMessageNoPress: string = 'Retry Audiometry No Button Pressed';
  protected readonly retryMessageWithPress: string = 'Retry Audiometry Button Pressed Hold';

  // State
  state: ResponseAreaState = ResponseAreaState.Start;
  device: IDevice | undefined;
  results: TResults | undefined;
  levelProgressionData: TrialProgressionPlotDataInterface | undefined;
  frequencyProgressionData: TrialProgressionPlotDataInterface | undefined;
  combinedAudiogramData: AudiometryResultsInterface | undefined;
  protected currentPageId: string | undefined;
  protected abstract examProperties: TExamProperties;

  private buttonPressCount = 0;
  private failedOnce = false;
  private initialized = false;
  protected examActive = false;
  private examPlaying = false;

  // The device can lag streaming the full results after the exam ends, so a longer timeout is
  // used for the final results fetch than for the lightweight status polling.
  protected readonly finalResultsTimeoutMs = 7000;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;

  private pageSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.examService.submit = () => this.submitWithNotes();
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === this.responseAreaType) {
        this.currentPageId = updatedPage.id;
        await this.setupResponseArea(updatedPage.responseArea as TResponseArea);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Initialize the response area from the protocol definition and resolve the devices.
   * @param responseArea The exam's response area definition.
   */
  private async setupResponseArea(responseArea: TResponseArea): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.autoSubmit = responseArea.autoSubmit ?? this.autoSubmit;
    this.autoBegin = responseArea.autoBegin ?? this.autoBegin;
    this.examInstructions = responseArea.examInstructions ?? this.examInstructions;
    this.resultMainText = responseArea.resultMainText ?? this.resultMainText;
    this.resultSubText = responseArea.resultSubText ?? this.resultSubText;
    this.useSoftwareButton = responseArea.examProperties?.UseSoftwareButton ?? this.useSoftwareButton;
    this.examProperties = { ...this.examProperties, ...responseArea.examProperties };
    this.hideExamProperties = responseArea.hideExamProperties ?? this.hideExamProperties;
    this.showMessageIfNoResponse = responseArea.showMessageIfNoResponse ?? this.showMessageIfNoResponse;
    this.noResponseCustomMessage = responseArea.noResponseCustomMessage ?? this.noResponseCustomMessage;
    this.repeatIfFailedOnce = responseArea.repeatIfFailedOnce ?? this.repeatIfFailedOnce;
    this.getNotesIfFailedTwice = responseArea.getNotesIfFailedTwice ?? this.getNotesIfFailedTwice;
    this.plotProperties = { ...this.plotProperties, ...responseArea.plotProperties };
    this.maskingNoise = responseArea.maskingNoise ?? this.maskingNoise;
    this.showProperties = this.getPropertiesVisibility(this.state, this.hideExamProperties);

    await this.setupDevice(responseArea);

    if (this.autoBegin && this.device) {
      await this.beginExam();
    }
  }

  /**
   * Resolve the device used to run the exam.
   * @param responseArea The exam's response area definition.
   */
  private async setupDevice(responseArea: TResponseArea): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error(`${this.examLabel}: no device available.`);
    }
  }

  /**
   * Queue and run the exam on the device, polling until it reports completion.
   */
  async beginExam(): Promise<void> {
    if (!this.device) {
      await this.devicesService.deviceNotFound();
      return;
    }
    this.updateResponseAreaState(ResponseAreaState.Exam);
    this.buttonPressCount = 0;
    this.retryMessage = undefined;
    this.noResponseMessage = undefined;
    this.stateModel.updateState({ isSubmittable: false });
    await this.devicesService.abortExams(this.device);
    if (this.maskingNoise) {
      await this.devicesService.startMaskingNoise(this.device, this.maskingNoise);
    }
    await this.devicesService.queueExam(this.device, this.examName, this.examProperties);
    this.examActive = true;

    // Poll status (not results) while the adaptive exam runs.
    this.startStatusPolling(() => this.fetchAndFinishExam());
  }

  /**
   * Fetch the final results once the exam has completed and move to the results view.
   */
  private async fetchAndFinishExam(): Promise<void> {
    if (this.device && this.maskingNoise) {
      await this.devicesService.stopMaskingNoise(this.device);
    }
    const results = await this.requestExamResults(this.finalResultsTimeoutMs);
    if (results) {
      this.postProcessResults(results);
    } else {
      this.logger.error(`${this.examLabel}: exam completed but no final results were returned.`);
    }
    this.processResults(results);
  }

  /**
   * Apply the no-response-message, repeat-on-fail, and get-notes-on-second-fail checks to a
   * completed exam's results, then move to whichever view they land on.
   * @param results The final results returned by the device.
   */
  private processResults(results: TResults | undefined): void {
    const shouldShowNoResponseMessage = this.useSoftwareButton && this.showMessageIfNoResponse && this.buttonPressCount === 0;
    const repeatForFailure = this.repeatIfFailedOnce && !this.isResultSuccessful(results);
    if (repeatForFailure && !this.failedOnce) {
      this.failedOnce = true;
      this.retryMessage = this.useSoftwareButton && this.buttonPressCount === 0 ? this.retryMessageNoPress : this.retryMessageWithPress;
      this.updateResponseAreaState(ResponseAreaState.Start);
      this.stateModel.updateState({ isSubmittable: false });
    } else if (repeatForFailure && this.getNotesIfFailedTwice) {
      this.autoSubmit = false;
      this.finishExam(results);
      this.updateResponseAreaState(ResponseAreaState.Notes);
    } else if (shouldShowNoResponseMessage) {
      this.logger.warning(`${this.examLabel}: no software button presses during this exam - showing user a message about it.`);
      this.autoSubmit = false;
      this.noResponseMessage = this.noResponseCustomMessage;
      this.finishExam(results);
    } else {
      this.finishExam(results);
    }
  }

  /**
   * Record the final results and move to the results view.
   * @param results The final results returned by the device.
   */
  private finishExam(results: TResults | undefined): void {
    this.results = results;
    this.levelProgressionData = undefined;
    this.frequencyProgressionData = undefined;
    if (results) {
      this.buildProgressionPlots(results);
    }
    this.combinedAudiogramData =
      this.shouldBuildCombinedAudiogram() && this.plotProperties.displayAudiogram?.length ? this.buildCombinedAudiogramData(results) : undefined;
    this.updateResponseAreaState(ResponseAreaState.Results);
    this.resultsModel.updateCurrentPage({ response: results });
    this.stateModel.updateState({ isSubmittable: true });
    if (this.autoSubmit) {
      this.submitWithNotes();
    }
  }

  /**
   * Build the combined audiogram data for the pages listed in plotProperties.displayAudiogram:
   * the current (not-yet-submitted) page's own result, plus every other page of this exam type in
   * that list that has already been submitted earlier in this protocol run.
   * @param results The final results returned by the device for the current page.
   */
  private buildCombinedAudiogramData(results: TResults | undefined): AudiometryResultsInterface {
    const pageIds = this.plotProperties.displayAudiogram ?? [];

    const datums: AudiometryCombinedDatum[] = [];
    const current = this.buildAudiogramDatum(this.examProperties, results);
    if (current) {
      datums.push(current);
    }

    this.resultsModel
      .getResults()
      .currentExam.responses.filter(
        (r: CurrentResults) => r.pageId !== this.currentPageId && r.responseArea === this.responseAreaType && pageIds.includes(r.pageId)
      )
      .forEach((r: CurrentResults) => {
        const examProperties = (r.page?.responseArea as TResponseArea)?.examProperties;
        if (!examProperties) {
          return;
        }
        const datum = this.buildAudiogramDatum(examProperties, r.response as TResults);
        if (datum) {
          datums.push(datum);
        }
      });

    return assembleAudiometryResults(datums, this.getLevelUnits());
  }

  /**
   * Update the page state and any side effects of doing so.
   */
  updateResponseAreaState(state: ResponseAreaState): void {
    this.state = state;
    this.showProperties = this.getPropertiesVisibility(this.state, this.hideExamProperties);
  }

  /**
   * Get whether the properties for the exam should be visible.
   * @param state Current response area state
   * @param hideProperties The hide exam properties enumeration.
   * @returns True if the properties should be visible, false otherwise.
   */
  getPropertiesVisibility(state: ResponseAreaState, hideProperties: AudiometryHideExamProps): boolean {
    switch (hideProperties) {
      case AudiometryHideExamProps.Never:
        return true;
      case AudiometryHideExamProps.Always:
        return false;
      case AudiometryHideExamProps.Before:
        return state !== ResponseAreaState.Start;
      case AudiometryHideExamProps.During:
        return state !== ResponseAreaState.Exam;
      default:
        hideProperties satisfies never;
        return false;
    }
  }

  /**
   * Attach administrator notes to the results and submit manually.
   */
  submitWithNotes(): void {
    if (this.results && this.getNotesIfFailedTwice) {
      this.resultsModel.updateCurrentPage({ response: { ...this.results, notes: this.adminNotes } });
    }
    this.examService.submitDefault();
  }

  /**
   * Forward the button press to the device. In 'hold' mode the button stays down until
   * onPressEnd; in 'tap' mode it auto-releases shortly after being pressed.
   */
  async onPressStart(): Promise<void> {
    if (!this.device || !this.examActive) {
      return;
    }
    this.buttonPressCount++;
    await this.devicesService.setSoftwareButtonState(this.device, 1);
    if (this.pressMode === 'tap') {
      setTimeout(async () => {
        if (!this.device || !this.examActive) {
          return;
        }
        await this.devicesService.setSoftwareButtonState(this.device, 0);
      }, 20);
    }
  }

  /**
   * Forward the button-up state to the device when the subject releases a held button.
   * No-op in 'tap' mode, which releases itself.
   */
  async onPressEnd(): Promise<void> {
    if (this.pressMode !== 'hold' || !this.device || !this.examActive) {
      return;
    }
    await this.devicesService.setSoftwareButtonState(this.device, 0);
  }

  /**
   * Poll the device's status and invoke onComplete once the exam has run
   * and returned to the ready state.
   * @param onComplete Callback invoked once the exam has finished.
   */
  private startStatusPolling(onComplete: () => void): void {
    this.examPlaying = false;
    const poll = async () => {
      if (!this.examActive || !this.device) {
        return;
      }
      try {
        const state = await this.requestExamStatus();
        if (state === ChaExamState.Playing) {
          this.examPlaying = true;
        }
        // Only treat "ready" as done once we have seen the exam actually start playing,
        // otherwise a status poll landing before playback begins would end it immediately.
        if (this.examPlaying && state === ChaExamState.Ready) {
          this.examActive = false;
          onComplete();
          return;
        }
        this.pollTimeout = setTimeout(poll, 500);
      } catch (error) {
        this.logger.error(`${this.examLabel}: error polling status: ${error}`);
        this.examActive = false;
      }
    };
    this.pollTimeout = setTimeout(poll, 500);
  }

  /**
   * Request the device's exam status and extract its numeric state.
   * @returns The device state, or undefined if the response was not usable.
   */
  private async requestExamStatus(): Promise<number | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestStatus(this.device);
    if (isStatusResponse(resp)) {
      return resp.msg[1].state;
    }
    this.logger.debug(`${this.examLabel}: unexpected requestStatus response: ${JSON.stringify(resp?.msg)}`);
    return undefined;
  }

  /**
   * Abort any running exam on the device and stop polling.
   */
  private stopExam(): void {
    this.examActive = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = undefined;
    }
    if (this.device) {
      this.devicesService.abortExams(this.device);
      if (this.maskingNoise) {
        this.devicesService.stopMaskingNoise(this.device);
      }
    }
  }

  /**
   * Whether the given result counts as a success for the repeat-on-failure/notes-on-second-
   * failure logic (e.g. 'Threshold', or for a Hughson-Westlake screener also 'Pass').
   * @param results The final results returned by the device.
   */
  protected abstract isResultSuccessful(results: TResults | undefined): boolean;

  /**
   * Request results from the device and extract this exam's results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   */
  protected abstract requestExamResults(timeoutMs?: number): Promise<TResults | undefined>;

  /**
   * Build whichever trial-progression plot(s) this exam type shows, assigning
   * levelProgressionData/frequencyProgressionData. Called only when results are defined.
   * @param results The final results returned by the device.
   */
  protected abstract buildProgressionPlots(results: TResults): void;

  /**
   * Map one page's exam properties and device result into a single combined audiogram datum, or
   * null if that page has no usable result to plot.
   * @param examProperties The page's configured exam properties.
   * @param results The page's device result.
   */
  protected abstract buildAudiogramDatum(examProperties: TExamProperties, results: TResults | undefined): AudiometryCombinedDatum | null;

  /**
   * Hook invoked right after a successful requestExamResults, before repeat/notes handling - only
   * Hughson-Westlake overrides this, to remap its screener ResultType to pass/fail vocabulary.
   * @param results The final results returned by the device.
   */
  protected postProcessResults(_results: TResults): void {
    // No-op by default.
  }

  /**
   * Whether a combined audiogram should be built at all for the current result - overridden by
   * Hughson-Westlake to suppress it in screener mode, which has no threshold to plot.
   */
  protected shouldBuildCombinedAudiogram(): boolean {
    return true;
  }

  /**
   * The level units the combined audiogram should be labeled with.
   */
  protected getLevelUnits(): string {
    return this.examProperties.LevelUnits ?? AudiometryLevelUnits.dbHl;
  }
}
