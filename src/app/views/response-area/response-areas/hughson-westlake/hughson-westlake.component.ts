import { Component } from '@angular/core';

import { hughsonWestlakeSchema } from '../../../../../schema/response-areas/hughson-westlake.schema';
import {
  HughsonWestlakeResultsInterface,
  HughsonWestlakeExamPropertiesInterface,
  HughsonWestlakeResponseAreaInterface,
} from './hughson-westlake.interface';
import { isWahtsResultsResponse } from '../../../../guards/type.guard';
import { AudiometryCombinedDatum } from '../shared/audiometry/audiometry.interface';
import { outputChannelToEarChannel } from '../shared/audiometry/audiometry.utility';
import { AutomatedAudiometryExamComponentBase } from '../shared/audiometry/automated-audiometry-exam.base';

const examSchema = hughsonWestlakeSchema.properties;
const examPropSchema = hughsonWestlakeSchema.properties.examProperties.properties;

@Component({
  selector: 'app-hughson-westlake-exam',
  templateUrl: './hughson-westlake.component.html',
  styleUrl: './hughson-westlake.component.css',
})
export class HughsonWestlakeComponent extends AutomatedAudiometryExamComponentBase<
  HughsonWestlakeResultsInterface,
  HughsonWestlakeExamPropertiesInterface,
  HughsonWestlakeResponseAreaInterface
> {
  protected readonly examName = 'HughsonWestlake';
  protected readonly responseAreaType = 'hughsonWestlakeResponseArea' as const;
  protected readonly examLabel = 'Hughson-Westlake exam';
  protected readonly pressMode = 'tap' as const;
  protected override readonly retryMessageWithPress = 'Retry Audiometry Button Pressed';

  // Configuration
  override autoSubmit: boolean = examSchema.autoSubmit.default;
  override autoBegin: boolean = examSchema.autoBegin.default;
  override useSoftwareButton: boolean = examPropSchema.UseSoftwareButton.default;
  override resultMainText: string = examSchema.resultMainText.default;
  override resultSubText: string = examSchema.resultSubText.default;
  override hideExamProperties = examSchema.hideExamProperties.default;
  override showMessageIfNoResponse: boolean = examSchema.showMessageIfNoResponse.default;
  override noResponseCustomMessage: string = examSchema.noResponseCustomMessage.default;
  override repeatIfFailedOnce: boolean = examSchema.repeatIfFailedOnce.default;
  override getNotesIfFailedTwice: boolean = examSchema.getNotesIfFailedTwice.default;
  override plotProperties = {
    displayAudiogram: examSchema.plotProperties.properties.displayAudiogram.default,
    displayLevelProgression: examSchema.plotProperties.properties.displayLevelProgression.default,
  };

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

  /**
   * A converged 'Threshold' result is a success; in screener mode a converged result is remapped
   * to 'Pass' by postProcessResults before this runs, so both are accepted here.
   * @param results The final results returned by the device.
   */
  protected isResultSuccessful(results: HughsonWestlakeResultsInterface | undefined): boolean {
    return results?.ResultType === 'Pass' || results?.ResultType === 'Threshold';
  }

  /**
   * When running as a screener (pass/fail at Lstart instead of a full threshold search), remap
   * the device's raw ResultType to the screener's pass/fail vocabulary: a converged "Threshold"
   * result means the screener passed, an out-of-range result is unused, and anything else that
   * failed to converge is a fail.
   * @param results The results to remap in place.
   */
  protected override postProcessResults(results: HughsonWestlakeResultsInterface): void {
    if (!this.examProperties.Screener) {
      return;
    }
    if (results.ResultType === 'Threshold') {
      results.ResultType = 'Pass';
    } else if (results.ResultType === 'Hearing Potentially Outside Measurable Range') {
      results.ResultType = 'Unused';
    } else if (results.ResultType === 'Failed to Converge') {
      results.ResultType = 'Fail';
    }
  }

  /**
   * The combined audiogram has no meaning for a pass/fail screener, which has no threshold to plot.
   */
  protected override shouldBuildCombinedAudiogram(): boolean {
    return !this.examProperties.Screener;
  }

  /**
   * Build the data structure consumed by the shared trial-progression plot: one point per
   * presentation (dB level on the y axis), styled by whether the subject responded and whether
   * the presentation was one of the responses that confirmed the threshold (2-of-3 at the
   * threshold level). Level progression plotting should not be shown for a screener exam.
   *
   * The CHA firmware only populates `Threshold` when `ResultType` is `'Threshold'` — for any
   * other result (e.g. "Failed to Converge", out-of-range results) it is left undefined, so that
   * case is treated as "no confirmed threshold" rather than trusting a stray/undefined value.
   * @param results The final results returned by the device.
   */
  protected buildProgressionPlots(results: HughsonWestlakeResultsInterface): void {
    if (this.examProperties.Screener || !this.plotProperties.displayLevelProgression || !results.L) {
      return;
    }
    const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.Threshold);
    const pointStyles = results.L.map((level, i) => {
      const heard = (results.ResponseTime?.[i] ?? 0) > 0;
      if (hasThreshold && heard && level === results.Threshold) {
        return 'highlight' as const;
      }
      return heard ? ('filled' as const) : ('open' as const);
    });
    const levelUnits = this.getLevelUnits();
    let title = `Level Progression: ${results.ResultType} (${results.L.length} trials)`;
    if (hasThreshold) {
      title = `Threshold at ${this.round(results.Threshold, 2)} ${levelUnits} (${results.L.length} trials)`;
    }
    // Scale the y axis to the levels actually presented
    const maxLevel = results.L.length ? Math.max(...results.L) : undefined;
    this.levelProgressionData = {
      y: results.L,
      pointStyles,
      pointShape: 'diamond',
      connectLine: true,
      maxY: maxLevel === undefined ? 200 : maxLevel + 10,
      referenceLine: hasThreshold ? results.Threshold : undefined,
      xLabel: 'Presentation',
      yLabel: levelUnits,
      title,
    };
  }

  /**
   * Map one page's frequency/channel configuration and device result into a single combined
   * audiogram datum, or null if that page has no usable frequency/result to plot.
   * @param examProperties The page's configured exam properties.
   * @param results The page's device result.
   */
  protected buildAudiogramDatum(
    examProperties: HughsonWestlakeExamPropertiesInterface,
    results: HughsonWestlakeResultsInterface | undefined
  ): AudiometryCombinedDatum | null {
    if (examProperties.F === undefined || !results) {
      return null;
    }
    return {
      frequency: examProperties.F,
      threshold: Number.isFinite(results.Threshold) ? results.Threshold : null,
      channel: outputChannelToEarChannel(examProperties.OutputChannel),
      resultType: String(results.ResultType),
      masking: false,
    };
  }

  /**
   * Request results from the device and extract the Hughson-Westlake results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The results, or undefined if the response was not usable.
   */
  protected async requestExamResults(timeoutMs?: number): Promise<HughsonWestlakeResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isWahtsResultsResponse(resp)) {
      const results = resp.msg[1] as HughsonWestlakeResultsInterface;
      this.logger.debug(`${this.examLabel}: requestResults Threshold=${results.Threshold}, ResultType=${results.ResultType}`);
      return results;
    }
    this.logger.debug(`${this.examLabel}: unexpected requestResults response: ${JSON.stringify(resp?.msg)}`);
    return undefined;
  }
}
