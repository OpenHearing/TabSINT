import { AudiometryResultsInterface } from '../../../../../interfaces/audiometry-results.interface';
import { AudiometryCombinedDatum } from './audiometry.interface';

/**
 * Assemble a list of per-page combined-audiogram datums into a parallel-array.
 * @param datums One datum per page contributing to the combined audiogram.
 * @param levelUnits The level units shared by every datum.
 */
export function assembleAudiometryResults(datums: AudiometryCombinedDatum[], levelUnits: string): AudiometryResultsInterface {
  return {
    frequencies: datums.map(d => d.frequency),
    thresholds: datums.map(d => d.threshold),
    channels: datums.map(d => d.channel),
    resultTypes: datums.map(d => d.resultType),
    masking: datums.map(d => d.masking),
    levelUnits,
  };
}
