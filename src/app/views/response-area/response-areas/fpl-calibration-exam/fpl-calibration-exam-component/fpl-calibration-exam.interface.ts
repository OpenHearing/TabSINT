import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

export interface FPLCalibrationExamInterface extends CommonResponseAreaInterface {
  tabsintId?: string;
  outputChannels: string[];
  fStart?: number;
  fEnd?: number;
  sweepDuration?: number;
  windowDuration?: number;
  numFrequencies?: number;
  numSweeps?: number;
  responseRequired?: boolean;
  showResults?: boolean;
}
