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
import { round } from '../../../../utilities/math';
import { bhaftSchema } from '../../../../../schema/response-areas/bhaft.schema';
import { BhaftResultsInterface, BhaftExamPropertiesInterface, BhaftResponseAreaInterface } from './bhaft.interface';
import { isWahtsResultsResponse, isStatusResponse } from '../../../../guards/type.guard';
import { AudiometryHideExamProps, MaskingNoise, PlotProperties } from '../shared/audiometry/audiometry.interface';
import { TrialPointStyle, TrialProgressionPlotDataInterface } from '../shared/trial-progression-plot/trial-progression-plot.interface';

const EXAM_NAME = 'BHAFT';
const examSchema = bhaftSchema.properties;
const examPropSchema = bhaftSchema.properties.examProperties.properties;
const retry_message_no_press = 'Retry Audiometry No Button Pressed';
const retry_message_with_press = 'Retry Audiometry Button Pressed';

enum ChaExamState {
  Ready = 1,
  Playing = 2,
}

enum ResponseAreaState {
  Start = 'start',
  Exam = 'exam',
  Results = 'results',
  Notes = 'notes',
}

@Component({
  selector: 'app-bhaft-exam',
  templateUrl: './bhaft.component.html',
  styleUrl: './bhaft.component.css',
})
export class BhaftComponent implements OnInit, OnDestroy {
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly examService = inject(ExamService);
  private readonly devicesService = inject(DevicesService);
  private readonly logger = inject(Logger);
  ResponseAreaState = ResponseAreaState;
  readonly round = round;

  private readonly allowableDevices = [DeviceType.Wahts];

  // Configuration
  autoSubmit: boolean = examSchema.autoSubmit.default;
  autoBegin: boolean = examSchema.autoBegin.default;
  useSoftwareButton: boolean = examPropSchema.UseSoftwareButton.default;
  examInstructions: string | undefined;
  resultMainText: string = examSchema.resultMainText.default;
  resultSubText: string = examSchema.resultSubText.default;
  noResponseMessage: string | undefined;
  retryMessage: string | undefined;
  adminNotes = '';
  showProperties = false;
  hideExamProperties: AudiometryHideExamProps = examSchema.hideExamProperties.default;
  showMessageIfNoResponse: boolean = examSchema.showMessageIfNoResponse.default;
  noResponseCustomMessage: string = examSchema.noResponseCustomMessage.default;
  repeatIfFailedOnce: boolean = examSchema.repeatIfFailedOnce.default;
  getNotesIfFailedTwice: boolean = examSchema.getNotesIfFailedTwice.default;
  plotProperties: PlotProperties = {
    displayAudiogram: examSchema.plotProperties.properties.displayAudiogram.default,
    displayLevelProgression: examSchema.plotProperties.properties.displayLevelProgression.default,
    displayFrequencyProgression: examSchema.plotProperties.properties.displayFrequencyProgression.default,
  };
  maskingNoise: MaskingNoise | undefined;

  // State
  bhaftState: ResponseAreaState = ResponseAreaState.Start;
  device: IDevice | undefined;
  results: BhaftResultsInterface | undefined;
  frequencyProgressionData: TrialProgressionPlotDataInterface | undefined;
  levelProgressionData: TrialProgressionPlotDataInterface | undefined;

  protected examProperties: BhaftExamPropertiesInterface = {
    Fstart: examPropSchema.Fstart.default,
    Level: examPropSchema.Level.default,
    ReversalDiscard: examPropSchema.ReversalDiscard.default,
    ReversalKeep: examPropSchema.ReversalKeep.default,
    IncrementStartMultiplierFrequency: examPropSchema.IncrementStartMultiplierFrequency.default,
    IncrementNominalFrequency: examPropSchema.IncrementNominalFrequency.default,
    IncrementStartMultiplierLevel: examPropSchema.IncrementStartMultiplierLevel.default,
    IncrementNominalLevel: examPropSchema.IncrementNominalLevel.default,
    SemiAutomaticMode: examPropSchema.SemiAutomaticMode.default,

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

  ngOnInit(): void {
    this.stateModel.updateState({ isSubmittable: false });
    this.examService.submit = () => this.submitWithNotes();
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe(async (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'bhaftResponseArea') {
        await this.setupResponseArea(updatedPage.responseArea as BhaftResponseAreaInterface);
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
   * @param responseArea The BHAFT response area definition.
   */
  private async setupResponseArea(responseArea: BhaftResponseAreaInterface): Promise<void> {
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
    this.showProperties = this.getPropertiesVisibility(this.bhaftState, this.hideExamProperties);

    await this.setupDevice(responseArea);

    if (this.autoBegin && this.device) {
      await this.beginExam();
    }
  }

  /**
   * Resolve the device used to run the exam.
   * @param responseArea The BHAFT response area definition.
   */
  private async setupDevice(responseArea: BhaftResponseAreaInterface): Promise<void> {
    const deviceList = await this.devicesService.getDeviceOrDefault(responseArea.tabsintId, this.allowableDevices);
    this.device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!this.device) {
      this.logger.error('BHAFT exam: no device available.');
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
    await this.devicesService.queueExam(this.device, EXAM_NAME, this.examProperties);
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
    const results = await this.requestBhaftResults(this.finalResultsTimeoutMs);
    if (!results) {
      this.logger.error('BHAFT exam: exam completed but no final results were returned.');
    }
    this.processResults(results);
  }

  /**
   * Apply the no-response-message, repeat-on-fail, and get-notes-on-second-fail checks to a
   * completed exam's results, then move to whichever view they land on.
   * @param results The final results returned by the device.
   */
  private processResults(results: BhaftResultsInterface | undefined): void {
    const shouldShowNoResponseMessage = this.useSoftwareButton && this.showMessageIfNoResponse && this.buttonPressCount === 0;
    const repeatForFailure = this.repeatIfFailedOnce && results?.ResultType !== 'Threshold';
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
      this.logger.warning('BHAFT exam: no software button presses during this exam - showing user a message about it.');
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
  private finishExam(results: BhaftResultsInterface | undefined): void {
    this.results = results;
    this.frequencyProgressionData =
      this.plotProperties.displayFrequencyProgression && results?.F ? this.createFrequencyProgressionData(results) : undefined;
    this.levelProgressionData = this.plotProperties.displayLevelProgression && results?.L ? this.createLevelProgressionData(results) : undefined;
    this.updateResponseAreaState(ResponseAreaState.Results);
    this.resultsModel.updateCurrentPage({ response: results });
    this.stateModel.updateState({ isSubmittable: true });
    if (this.autoSubmit) {
      this.submitWithNotes();
    }
  }

  /**
   * Build the data structure consumed by the shared trial-progression plot for the frequency
   * track: one point per presentation (Hz on the y axis), filled for a hit (heard) or open for a
   * miss (not heard) — see classifyHitOrMiss for how that's inferred.
   * @param results The final results returned by the device.
   */
  private createFrequencyProgressionData(results: BhaftResultsInterface): TrialProgressionPlotDataInterface {
    const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.ThresholdFrequency);
    let title = `Frequency Progression: ${results.ResultType} (${results.F.length} trials)`;
    if (hasThreshold) {
      title = `Frequency Threshold at ${this.round(results.ThresholdFrequency, 1)} Hz (${results.F.length} trials)`;
    }
    // Scale the y axis to the frequencies actually presented
    const maxFrequency = results.F.length ? Math.max(...results.F) : 0;
    return {
      y: results.F,
      pointStyles: this.classifyHitOrMiss(results.F, results.L),
      pointShape: 'circle',
      connectLine: true,
      maxY: maxFrequency === 0 ? 20000 : maxFrequency * 1.1,
      referenceLine: hasThreshold ? results.ThresholdFrequency : undefined,
      referenceLineColor: '#FF0000',
      xLabel: 'Presentation',
      yLabel: 'Hz',
      title,
    };
  }

  /**
   * Build the data structure consumed by the shared trial-progression plot for the level track.
   * The y axis is always dB SPL — BHAFT is only ever defined in dB SPL regardless of LevelUnits.
   * Point styles come from the same classifyHitOrMiss call as the frequency plot (a hit/miss is a
   * single event per presentation), so both plots stay consistent with each other.
   * @param results The final results returned by the device.
   */
  private createLevelProgressionData(results: BhaftResultsInterface): TrialProgressionPlotDataInterface {
    const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.ThresholdLevel);
    let title = `Level Progression: ${results.ResultType} (${results.L.length} trials)`;
    if (hasThreshold) {
      title = `Level Threshold at ${this.round(results.ThresholdLevel, 2)} dB SPL (${results.L.length} trials)`;
    }
    const maxLevel = results.L.length ? Math.max(...results.L) : 0;
    return {
      y: results.L,
      pointStyles: this.classifyHitOrMiss(results.F, results.L),
      pointShape: 'circle',
      connectLine: true,
      maxY: maxLevel === 0 ? 200 : maxLevel + 10,
      referenceLine: hasThreshold ? results.ThresholdLevel : undefined,
      referenceLineColor: '#FF0000',
      xLabel: 'Presentation',
      yLabel: 'dB SPL',
      title,
    };
  }

  /**
   * Classify each presentation as a 'filled' hit (heard) or an 'open' miss (not heard)
   * Two options: FLFT: frequency varies while level holds at Level; FFLT: frequency holds at
   * MaximumOutputFrequency while level varies instead, and a hit moves the two tracks in OPPOSITE
   * directions: it pushes frequency UP but pulls level DOWN.So for each step, whichever track actually
   * changed determines hit/miss for that presentation.
   * @param frequencies The frequency track (Hz).
   * @param levels The level track (dB SPL), same length as frequencies.
   * @returns One style per presentation ('filled' for a hit, 'open' for a miss), in the same order.
   */
  private classifyHitOrMiss(frequencies: number[], levels: number[]): TrialPointStyle[] {
    if (frequencies.length < 2) {
      return frequencies.map(() => 'filled');
    }
    return frequencies.map((f, i) => {
      if (i < frequencies.length - 1) {
        if (frequencies[i + 1] !== f) {
          return frequencies[i + 1] > f ? 'filled' : 'open';
        }
        // Frequency held flat (at the ceiling): level is the track actually moving instead, with
        // the opposite polarity — a hit pulls level down.
        return levels[i + 1] < levels[i] ? 'filled' : 'open';
      }
      if (f !== frequencies[i - 1]) {
        return f > frequencies[i - 1] ? 'filled' : 'open';
      }
      return levels[i] < levels[i - 1] ? 'filled' : 'open';
    });
  }

  /**
   * Update the page state and any side effects of doing so.
   */
  updateResponseAreaState(state: ResponseAreaState): void {
    this.bhaftState = state;
    this.showProperties = this.getPropertiesVisibility(this.bhaftState, this.hideExamProperties);
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
   * Forward the button-down state to the device when the subject presses and holds the button.
   */
  async onPressStart(): Promise<void> {
    if (!this.device || !this.examActive) {
      return;
    }
    this.buttonPressCount++;
    await this.devicesService.setSoftwareButtonState(this.device, 1);
  }

  /**
   * Forward the button-up state to the device when the subject releases the button.
   */
  async onPressEnd(): Promise<void> {
    if (!this.device || !this.examActive) {
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
        const state = await this.requestBhaftStatus();
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
        this.logger.error('BHAFT exam: error polling status: ' + error);
        this.examActive = false;
      }
    };
    this.pollTimeout = setTimeout(poll, 500);
  }

  /**
   * Request the device's exam status and extract its numeric state.
   * @returns The device state, or undefined if the response was not usable.
   */
  private async requestBhaftStatus(): Promise<number | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestStatus(this.device);
    if (isStatusResponse(resp)) {
      const state = resp.msg[1].state;
      return state;
    }
    this.logger.debug('BHAFT exam: unexpected requestStatus response: ' + JSON.stringify(resp?.msg));
    return undefined;
  }

  /**
   * Request results from the device and extract the BHAFT results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The results, or undefined if the response was not usable.
   */
  private async requestBhaftResults(timeoutMs?: number): Promise<BhaftResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isWahtsResultsResponse(resp)) {
      const results = resp.msg[1] as BhaftResultsInterface;
      this.logger.debug(
        `BHAFT exam: requestResults ThresholdFrequency=${results.ThresholdFrequency}, ThresholdLevel=${results.ThresholdLevel}, ResultType=${results.ResultType}`
      );
      return results;
    }
    this.logger.debug('BHAFT exam: unexpected requestResults response: ' + JSON.stringify(resp?.msg));
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
}
