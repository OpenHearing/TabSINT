import { Component } from '@angular/core';

import { bhaftSchema } from '../../../../../schema/response-areas/bhaft.schema';
import { BhaftResultsInterface, BhaftExamPropertiesInterface, BhaftResponseAreaInterface } from './bhaft.interface';
import { isWahtsResultsResponse } from '../../../../guards/type.guard';
import { AudiometryCombinedDatum, AudiometryLevelUnits } from '../shared/audiometry/audiometry.interface';
import { TrialPointStyle } from '../shared/trial-progression-plot/trial-progression-plot.interface';
import { outputChannelToEarChannel } from '../shared/audiometry/audiometry.utility';
import { AutomatedAudiometryExamComponentBase } from '../shared/audiometry/automated-audiometry-exam.base';

const examSchema = bhaftSchema.properties;
const examPropSchema = bhaftSchema.properties.examProperties.properties;

@Component({
  selector: 'app-bhaft-exam',
  templateUrl: './bhaft.component.html',
  styleUrl: './bhaft.component.css',
})
export class BhaftComponent extends AutomatedAudiometryExamComponentBase<
  BhaftResultsInterface,
  BhaftExamPropertiesInterface,
  BhaftResponseAreaInterface
> {
  protected readonly examName = 'BHAFT';
  protected readonly responseAreaType = 'bhaftResponseArea' as const;
  protected readonly examLabel = 'BHAFT exam';
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
    displayFrequencyProgression: examSchema.plotProperties.properties.displayFrequencyProgression.default,
  };

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

  /**
   * @param results The final results returned by the device.
   */
  protected isResultSuccessful(results: BhaftResultsInterface | undefined): boolean {
    return results?.ResultType === 'Threshold';
  }

  /**
   * BHAFT is only ever defined in dB SPL regardless of LevelUnits.
   */
  protected override getLevelUnits(): string {
    return AudiometryLevelUnits.dbSpl;
  }

  /**
   * Build the frequency- and level-progression plots: one point per presentation, filled for a
   * hit (heard) or open for a miss (not heard) — see classifyHitOrMiss for how that's inferred.
   * @param results The final results returned by the device.
   */
  protected buildProgressionPlots(results: BhaftResultsInterface): void {
    if (this.plotProperties.displayFrequencyProgression && results.F) {
      const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.ThresholdFrequency);
      let title = `Frequency Progression: ${results.ResultType} (${results.F.length} trials)`;
      if (hasThreshold) {
        title = `Frequency Threshold at ${this.round(results.ThresholdFrequency, 1)} Hz (${results.F.length} trials)`;
      }
      // Scale the y axis to the frequencies actually presented
      const maxFrequency = results.F.length ? Math.max(...results.F) : 0;
      this.frequencyProgressionData = {
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

    if (this.plotProperties.displayLevelProgression && results.L) {
      const hasThreshold = results.ResultType === 'Threshold' && Number.isFinite(results.ThresholdLevel);
      let title = `Level Progression: ${results.ResultType} (${results.L.length} trials)`;
      if (hasThreshold) {
        title = `Level Threshold at ${this.round(results.ThresholdLevel, 2)} dB SPL (${results.L.length} trials)`;
      }
      const maxLevel = results.L.length ? Math.max(...results.L) : undefined;
      this.levelProgressionData = {
        y: results.L,
        pointStyles: this.classifyHitOrMiss(results.F, results.L),
        pointShape: 'circle',
        connectLine: true,
        maxY: maxLevel === undefined ? 200 : maxLevel + 10,
        referenceLine: hasThreshold ? results.ThresholdLevel : undefined,
        referenceLineColor: '#FF0000',
        xLabel: 'Presentation',
        yLabel: 'dB SPL',
        title,
      };
    }
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
   * Map one page's channel configuration and device result into a single combined audiogram
   * datum, or null if that page has no usable result to plot. Unlike Bekesy-like/Hughson-
   * Westlake, BHAFT searches frequency and level together, so both come off the result itself
   * rather than from a fixed examProperties.F.
   * @param examProperties The page's configured exam properties.
   * @param results The page's device result.
   */
  protected buildAudiogramDatum(
    examProperties: BhaftExamPropertiesInterface,
    results: BhaftResultsInterface | undefined
  ): AudiometryCombinedDatum | null {
    if (!results || !Number.isFinite(results.ThresholdFrequency)) {
      return null;
    }
    return {
      frequency: results.ThresholdFrequency,
      threshold: Number.isFinite(results.ThresholdLevel) ? results.ThresholdLevel : null,
      channel: outputChannelToEarChannel(examProperties.OutputChannel),
      resultType: String(results.ResultType),
      masking: false,
    };
  }

  /**
   * Request results from the device and extract the BHAFT results payload.
   * @param timeoutMs Optional override for how long to wait for the results response.
   * @returns The results, or undefined if the response was not usable.
   */
  protected async requestExamResults(timeoutMs?: number): Promise<BhaftResultsInterface | undefined> {
    if (!this.device) {
      return undefined;
    }
    const resp = await this.devicesService.requestResults(this.device, timeoutMs);
    if (resp?.msg && isWahtsResultsResponse(resp)) {
      const results = resp.msg[1] as BhaftResultsInterface;
      this.logger.debug(
        `${this.examLabel}: requestResults ThresholdFrequency=${results.ThresholdFrequency}, ThresholdLevel=${results.ThresholdLevel}, ResultType=${results.ResultType}`
      );
      return results;
    }
    this.logger.debug(`${this.examLabel}: unexpected requestResults response: ${JSON.stringify(resp?.msg)}`);
    return undefined;
  }
}
