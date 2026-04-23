import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';
import { AudioChannel, ButtonAlignment } from '../../../../utilities/constants';

export interface BekesyResponseAreaInterface extends CommonResponseAreaInterface {
  type: 'bekesyResponseArea';
  autoSubmit?: boolean;
  enableSubmit?: boolean;
  buttonBehavior?: 'lowerOnClick' | 'higherOnClick';
  saturatedRollOver?: boolean;
  lookUpCorrection?: Record<string, number[]>;
  channel?: AudioChannel;
  startSPL?: number[] | number;
  buttonText?: string;
  buttonPressedText?: string;
  buttonReleasedText?: string;
  buttonAlign?: ButtonAlignment;
  minTargetLevel?: number;
  maxTargetLevel?: number;
  timeout?: number;
  levelRate?: number;
  numberReversals?: number;
}

export interface BekesyResultsInterface {
  splLevel: number;
  splLevelRequested?: number;
  splLevelFixed?: number;
  time: string;
  button: number;
  lookUpCorrection: number;
}
