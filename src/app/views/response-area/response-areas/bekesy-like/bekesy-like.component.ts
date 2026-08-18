import { Component } from '@angular/core';

import { bekesyLikeSchema } from '../../../../../schema/response-areas/bekesy-like.schema';
import { BekesyLikeResultsInterface, BekesyLikeExamPropertiesInterface, BekesyLikeResponseAreaInterface } from './bekesy-like.interface';
import { isWahtsResultsResponse } from '../../../../guards/type.guard';
import { AudiometryCombinedDatum } from '../shared/audiometry/audiometry.interface';
import { TrialPointStyle } from '../shared/trial-progression-plot/trial-progression-plot.interface';
import { outputChannelToEarChannel } from '../shared/audiometry/audiometry-channel.utility';
import { AutomatedAudiometryExamComponentBase } from '../shared/audiometry/automated-audiometry-exam.base';

const examSchema = bekesyLikeSchema.properties;
const examPropSchema = bekesyLikeSchema.properties.examProperties.properties;

@Component({
  selector: 'app-bekesy-like-exam',
  templateUrl: './bekesy-like.component.html',
  styleUrl: './bekesy-like.component.css',
})
export class BekesyLikeComponent extends AutomatedAudiometryExamComponentBase<
  BekesyLikeResultsInterface,
  BekesyLikeExamPropertiesInterface,
  BekesyLikeResponseAreaInterface
> {
  protected readonly examName = 'BekesyLike';
  protected readonly responseAreaType = 'bekesyLikeResponseArea' as const;
  protected readonly examLabel = 'Bekesy Like exam';
  protected readonly pressMode = 'hold' as const;

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

  protected examProperties: BekesyLikeExamPropertiesInterface = {
    ReversalDiscard: examPropSchema.ReversalDiscard.default,
    ReversalKeep: examPropSchema.ReversalKeep.default,
    IncrementStart: examPropSchema.IncrementStart.default,
    IncrementNominal: examPropSchema.IncrementNominal.default,

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
   * @param results The final results returned by the device.
   */
  protected isResultSuccessful(results: BekesyLikeResultsInterface | undefined): boolean {
    return results?.ResultType === 'Threshold';
  }

  /**
   * Build the data structure consumed by the shared trial-progression plot: one point per
   * presentation (dB level on the y axis), styled by whether the level was pulled down (a hit -
   * the subject held the button because they heard the tone) or pushed up (a miss) between that
   * presentation and the next - see classifyLevelDirection.
   * @param results The final results returned by the device.
   */
  protected buildProgressionPlots(results: BekesyLikeResultsInterface): void {
    if (!this.plotProperties.displayLevelProgression || !results.L) {
      return;
    }
    const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.Threshold);
    const levelUnits = this.getLevelUnits();
    let title = `Level Progression: ${results.ResultType} (${results.L.length} trials)`;
    if (hasThreshold) {
      title = `Threshold at ${this.round(results.Threshold, 2)} ${levelUnits} (${results.L.length} trials)`;
    }
    const maxLevel = results.L.length ? Math.max(...results.L) : undefined;
    this.levelProgressionData = {
      y: results.L,
      pointStyles: this.classifyLevelDirection(results.L),
      pointShape: 'circle',
      connectLine: true,
      maxY: maxLevel === undefined ? 200 : maxLevel + 10,
      referenceLine: hasThreshold ? results.Threshold : undefined,
      xLabel: 'Presentation',
      yLabel: levelUnits,
      title,
    };
  }

  /**
   * Classify each presentation as a 'filled' hit (the subject held the button, pulling the level
   * down) or an 'open' miss (the subject released the button, letting the level climb back up).
   * @param levels The level track (LevelUnits).
   * @returns One style per presentation ('filled' for a hit, 'open' for a miss), in the same order.
   */
  private classifyLevelDirection(levels: number[]): TrialPointStyle[] {
    if (levels.length < 2) {
      return levels.map(() => 'filled');
    }
    return levels.map((level, i) => {
      if (i < levels.length - 1) {
        return levels[i + 1] < level ? 'filled' : 'open';
      }
      return level < levels[i - 1] ? 'filled' : 'open';
    });
  }

  /**
   * Map one page's frequency/channel configuration and device result into a single combined
   * audiogram datum, or null if that page has no usable frequency/result to plot.
   * @param examProperties The page's configured exam properties.
   * @param results The page's device result.
   */
  protected buildAudiogramDatum(
    examProperties: BekesyLikeExamPropertiesInterface,
    results: BekesyLikeResultsInterface | undefined
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
   * Request results from the device and extract the Bekesy Like results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The results, or undefined if the response was not usable.
   */
  protected async requestExamResults(timeoutMs?: number): Promise<BekesyLikeResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isWahtsResultsResponse(resp)) {
      const results = resp.msg[1] as BekesyLikeResultsInterface;
      this.logger.debug(`${this.examLabel}: requestResults Threshold=${results.Threshold}, ResultType=${results.ResultType}`);
      return results;
    }
    this.logger.debug(`${this.examLabel}: unexpected requestResults response: ${JSON.stringify(resp?.msg)}`);
    return undefined;
  }
}
