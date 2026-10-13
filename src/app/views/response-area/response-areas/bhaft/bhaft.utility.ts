import { outputChannelToEarChannel } from '../shared/audiometry/audiometry.utility';
import { AudiometryCombinedDatum, AudiometryLevelUnits } from '../shared/audiometry/audiometry.interface';
import { BhaftExamPropertiesInterface, BhaftResultsInterface } from './bhaft.interface';

/**
 * Build this page's contribution to a combined audiogram, from its exam properties and results.
 * @param examProperties The page's configured exam properties.
 * @param results The page's stored/final results.
 */
export function buildBhaftAudiogramDatum(
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

/** BHAFT results are always reported in dB SPL, independent of the page's configured level units. */
export function getBhaftLevelUnits(): string {
  return AudiometryLevelUnits.dbSpl;
}
