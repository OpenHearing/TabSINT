import { AudiometryResultsInterface, EarChannel } from '../../../../../interfaces/audiometry-results.interface';
import { AudiometryCombinedDatum, AudiometryOutputChannel } from './audiometry.interface';

/**
 * Map a CHA audiometry OutputChannel to the EarChannel expected by audiogram.
 *
 * @param outputChannel The exam's configured output channel(s).
 * @returns Ear channel for the audiogram.
 */
export function outputChannelToEarChannel(outputChannel: AudiometryOutputChannel | AudiometryOutputChannel[] | undefined): EarChannel {
  const channel = Array.isArray(outputChannel) ? outputChannel[0] : outputChannel;
  switch (channel) {
    case AudiometryOutputChannel.HPL0:
    case AudiometryOutputChannel.HPL1:
      return EarChannel.Left;
    case AudiometryOutputChannel.HPR0:
    case AudiometryOutputChannel.HPR1:
      return EarChannel.Right;
    case AudiometryOutputChannel.LINEL0_NONE:
      return EarChannel.BoneLeft;
    case AudiometryOutputChannel.NONE_LINEL0:
      return EarChannel.BoneRight;
    case AudiometryOutputChannel.LINEL0:
    case AudiometryOutputChannel.HPL0_HPR0:
      return EarChannel.Mono;
    default:
      return EarChannel.Mono;
  }
}

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
