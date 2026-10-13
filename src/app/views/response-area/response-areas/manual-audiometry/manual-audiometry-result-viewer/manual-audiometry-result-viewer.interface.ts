import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

export interface ManualAudiometryResultViewerInterface extends CommonResponseAreaInterface {
  type: 'manualAudiometryResultViewerResponseArea';
  pageIdsToDisplay: string[];
}
