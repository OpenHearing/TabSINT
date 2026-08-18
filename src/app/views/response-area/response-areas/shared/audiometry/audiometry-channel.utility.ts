import { AudiometryOutputChannel } from './audiometry.interface';

/**
 * Map a CHA audiometry OutputChannel (e.g. HPL0, HPR1, LINEL0 NONE) to the channel string
 * expected by AudiogramComponent/AudiometryResultsTableComponent.
 * @param outputChannel The exam's configured output channel(s).
 * @returns 'left'/'right' for air conduction, 'bone_left'/'bone_right' for bone conduction, 'mono' otherwise.
 */
export function outputChannelToEarChannel(outputChannel: AudiometryOutputChannel | AudiometryOutputChannel[] | undefined): string {
  const channel = Array.isArray(outputChannel) ? outputChannel[0] : outputChannel;
  switch (channel) {
    case AudiometryOutputChannel.HPL0:
    case AudiometryOutputChannel.HPL1:
      return 'left';
    case AudiometryOutputChannel.HPR0:
    case AudiometryOutputChannel.HPR1:
      return 'right';
    case AudiometryOutputChannel.LINEL0_NONE:
      return 'bone_left';
    case AudiometryOutputChannel.NONE_LINEL0:
      return 'bone_right';
    case AudiometryOutputChannel.LINEL0:
    case AudiometryOutputChannel.HPL0_HPR0:
      return 'mono';
    default:
      return 'mono';
  }
}
