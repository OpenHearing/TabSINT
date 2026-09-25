import { outputChannelToEarChannel } from '../shared/audiometry/audiometry.utility';
import { AudiometryCombinedDatum } from '../shared/audiometry/audiometry.interface';
import { BekesyLikeExamPropertiesInterface, BekesyLikeResultsInterface } from './bekesy-like.interface';

/**
 * Build this page's contribution to a combined audiogram, from its exam properties and results.
 * @param examProperties The page's configured exam properties.
 * @param results The page's stored/final results.
 */
export function buildBekesyLikeAudiogramDatum(
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
