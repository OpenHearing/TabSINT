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
import { hughsonWestlakeSchema } from '../../../../../schema/response-areas/hughson-westlake.schema';
import {
  HughsonWestlakeResultsInterface,
  HughsonWestlakeExamPropertiesInterface,
  HughsonWestlakeResponseAreaInterface,
} from './hughson-westlake.interface';
import { isWahtsResultsResponse, isStatusResponse } from '../../../../guards/type.guard';
import { AudiometryHideExamProps } from '../shared/audiometry/audiometry.interface';

const EXAM_NAME = 'HughsonWestlake';
const examSchema = hughsonWestlakeSchema.properties;
const examPropSchema = hughsonWestlakeSchema.properties.examProperties.properties;
const retry_message_no_press = 'Retry Audiometry No Button Pressed';
const retry_message_with_press = 'Retry Audiometry Button Pressed';

enum ChaExamState {
  Ready = 1,
  Playing = 2,
}

enum ResponseAreaState {
  Start = 'Start',
  Exam = 'Exam',
  Results = 'Results',
  Notes = 'Notes',
}

@Component({
  selector: 'app-hughson-westlake-exam',
  templateUrl: './hughson-westlake.component.html',
  styleUrl: './hughson-westlake.component.css',
})
export class HughsonWestlakeComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);
  ResponseAreaState = ResponseAreaState;

  // Configuration
  private readonly allowableDevices = [DeviceType.Wahts];

  autoSubmit: boolean = examSchema.autoSubmit.default;
  useSoftwareButton: boolean = examPropSchema.UseSoftwareButton.default;
  examInstructions: string | undefined;
  noResponseMessage: string | undefined;
  retryMessage: string | undefined;
  adminNotes = '';
  showProperties = false;
  hideExamProperties: AudiometryHideExamProps = examSchema.hideExamProperties.default;
  showMessageIfNoResponse: boolean = examSchema.showMessageIfNoResponse.default;
  noResponseCustomMessage: string = examSchema.noResponseCustomMessage.default;
  repeatIfFailedOnce: boolean = examSchema.repeatIfFailedOnce.default;
  getNotesIfFailedTwice: boolean = examSchema.getNotesIfFailedTwice.default;

  // State
  hwState: ResponseAreaState = ResponseAreaState.Start;
  device: IDevice | undefined;
  results: HughsonWestlakeResultsInterface | undefined;

  protected examProperties: HughsonWestlakeExamPropertiesInterface = {
    Screener: examPropSchema.Screener.default,
    StepSize: examPropSchema.StepSize.default,
    TonePulseNumber: examPropSchema.TonePulseNumber.default,
    PollingOffset: examPropSchema.PollingOffset.default,
    MinISI: examPropSchema.MinISI.default,
    MaxISI: examPropSchema.MaxISI.default,
    NumCorrectReq: examPropSchema.NumCorrectReq.default,
    SemiAutomaticMode: examPropSchema.SemiAutomaticMode.default,
    UseReducedInitialIncrement: examPropSchema.UseReducedInitialIncrement.default,

    // Audiometry Level
    F: examPropSchema.F.default,
    Lstart: examPropSchema.Lstart.default,

    // Audiometry
    LevelUnits: examPropSchema.LevelUnits.default,
    ToneRepetitionInterval: examPropSchema.ToneRepetitionInterval.default,
    PresentationMax: examPropSchema.PresentationMax.default,
    UnresponsiveMax: examPropSchema.UnresponsiveMax.default,
    UseSoftwareButton: examPropSchema.UseSoftwareButton.default,
    BypassCalibrationLimit: examPropSchema.BypassCalibrationLimit.default,

    // Tone Generation
    OutputChannel: examPropSchema.OutputChannel.default,
    ToneDuration: examPropSchema.ToneDuration.default,
    ToneRamp: examPropSchema.ToneRamp.default,
    UseWavFile: examPropSchema.UseWavFile.default,
    UseNthOctave: examPropSchema.UseNthOctave.default,
    OctaveBandSize: examPropSchema.OctaveBandSize.default,
    FDev: examPropSchema.FDev.default,
    FDevForm: examPropSchema.FDevForm.default,
    FDevRate: examPropSchema.FDevRate.default,
  };

  private buttonPressCount = 0;
  private failedOnce = false;
  private initialized = false;
  private examActive = false;
  private examPlaying = false;

  // The device can lag streaming the full results after the exam ends, so a longer timeout is
  // used for the final results fetch than for the lightweight status polling.
  private readonly finalResultsTimeoutMs = 7000;
  private pollTimeout: ReturnType<typeof setTimeout> | undefined;

  private pageSubscription: Subscription | undefined;

  // TODO fix initialize for back to back without destruction

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.examService.submit = () => this.submitWithNotes();
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'hughsonWestlakeResponseArea') {
        this.setupResponseArea(updatedPage.responseArea as HughsonWestlakeResponseAreaInterface);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopExam();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
  }

  /**
   * Initialize the response area from the protocol definition and resolve the device.s
   * @param responseArea The Hughson-Westlake response area definition.
   */
  private async setupResponseArea(responseArea: HughsonWestlakeResponseAreaInterface): Promise<void> {
    // The current page can emit more than once; only set up the exam once per page.
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.autoSubmit = responseArea.autoSubmit ?? this.autoSubmit;
    this.examInstructions = responseArea.examInstructions ?? this.examInstructions;
    this.useSoftwareButton = responseArea.examProperties?.UseSoftwareButton ?? this.useSoftwareButton;
    this.examProperties = { ...this.examProperties, ...(responseArea.examProperties ?? {}) };
    this.hideExamProperties = responseArea.hideExamProperties ?? this.hideExamProperties;
    this.showMessageIfNoResponse = responseArea.showMessageIfNoResponse ?? this.showMessageIfNoResponse;
    this.noResponseCustomMessage = responseArea.noResponseCustomMessage ?? this.noResponseCustomMessage;
    this.repeatIfFailedOnce = responseArea.repeatIfFailedOnce ?? this.repeatIfFailedOnce;
    this.getNotesIfFailedTwice = responseArea.getNotesIfFailedTwice ?? this.getNotesIfFailedTwice;
    this.showProperties = this.getPropertiesVisibility(this.hwState, this.hideExamProperties);

    await this.setupDevice(responseArea);
  }

  /**
   * Resolve the device used to run the exam.
   * @param responseArea The Hughson-Westlake response area definition.
   */
  private async setupDevice(responseArea: HughsonWestlakeResponseAreaInterface): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error('Hughson-Westlake exam: no device available.');
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
    await this.devicesService.queueExam(this.device, EXAM_NAME, this.examProperties);
    this.examActive = true;

    // Poll status (not results) while the adaptive exam runs.
    this.startStatusPolling(() => this.fetchAndFinishExam());
  }

  /**
   * Fetch the final results once the exam has completed and move to the results view.
   */
  private async fetchAndFinishExam(): Promise<void> {
    const results = await this.requestHughsonWestlakeResults(this.finalResultsTimeoutMs);
    if (!results) {
      this.logger.error('Hughson-Westlake exam: exam completed but no final results were returned.');
    }
    this.processResults(results);
  }

  /**
   * Apply the no-response-message, repeat-on-fail, and get-notes-on-second-fail checks to a
   * completed exam's results, then move to whichever view they land on.
   * @param results The final results returned by the device.
   */
  private processResults(results: HughsonWestlakeResultsInterface | undefined): void {
    const shouldShowNoResponseMessage = this.useSoftwareButton && this.showMessageIfNoResponse && this.buttonPressCount === 0;
    const repeatForFailure =
      this.repeatIfFailedOnce && (results === undefined || (results.ResultType !== 'Pass' && results.ResultType !== 'Threshold'));
    if (repeatForFailure && !this.failedOnce) {
      this.failedOnce = true;
      this.retryMessage = this.useSoftwareButton && this.buttonPressCount === 0 ? retry_message_no_press : retry_message_with_press;
      this.updateResponseAreaState(ResponseAreaState.Start);
      this.stateModel.updateState({ isSubmittable: false });
    } else if (repeatForFailure && this.getNotesIfFailedTwice) {
      this.autoSubmit = false;
      this.finishExam(results);
      this.updateResponseAreaState(ResponseAreaState.Notes);
    } else if (shouldShowNoResponseMessage) {
      this.logger.warning('Hughson-Westlake exam: no software button presses during this exam - showing user a message about it.');
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
  private finishExam(results: HughsonWestlakeResultsInterface | undefined): void {
    this.results = results;
    this.updateResponseAreaState(ResponseAreaState.Results);
    this.resultsModel.updateCurrentPage({ response: results });
    this.stateModel.updateState({ isSubmittable: true });
    if (this.autoSubmit) {
      this.submitWithNotes();
    }
  }

  /**
   * Update the page state and any side effects of doing so.
   */
  updateResponseAreaState(state: ResponseAreaState): void {
    this.hwState = state;
    this.showProperties = this.getPropertiesVisibility(this.hwState, this.hideExamProperties);
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
   * Update exam properties when a user press starts on the button.
   */
  async onPressStart() {
    if (!this.device || !this.examActive) {
      return;
    }
    this.buttonPressCount++;
    await this.devicesService.setSoftwareButtonState(this.device, 1);
    setTimeout(async () => {
      if (!this.device || !this.examActive) {
        return;
      }
      await this.devicesService.setSoftwareButtonState(this.device, 0);
    }, 20);
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
        const state = await this.requestHughsonWestlakeStatus();
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
        this.logger.error('Hughson-Westlake exam: error polling status: ' + error);
        this.examActive = false;
      }
    };
    this.pollTimeout = setTimeout(poll, 500);
  }

  /**
   * Request the device's exam status and extract its numeric state.
   * @returns The device state, or undefined if the response was not usable.
   */
  private async requestHughsonWestlakeStatus(): Promise<number | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestStatus(this.device);
    if (isStatusResponse(resp)) {
      const state = resp.msg[1].state;
      this.logger.debug(`Hughson-Westlake exam: requestStatus state=${state}`);
      return state;
    }
    this.logger.debug('Hughson-Westlake exam: unexpected requestStatus response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Request results from the device and extract the Hughson-Westlake results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The results, or undefined if the response was not usable.
   */
  private async requestHughsonWestlakeResults(timeoutMs?: number): Promise<HughsonWestlakeResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isWahtsResultsResponse(resp)) {
      const results = resp.msg[1] as HughsonWestlakeResultsInterface;
      this.logger.debug(`Hughson-Westlake exam: requestResults Threshold=${results.Threshold}, ResultType=${results.ResultType}`);
      return results;
    }
    this.logger.debug('Hughson-Westlake exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
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
    }
  }
}
