import { DpoaeCommonInterface, DpoaeResultsCommonInterface, DPOAEDataInterface } from '../../shared/dpoae/dpoae-common.interface';

export interface SweptDpoaeInterface extends DpoaeCommonInterface {
  f2Start?: number;
  f2End?: number;
  sweepDuration?: number;
  sweepType?: 'log' | 'linear';
  minSweeps?: number;
  maxSweeps?: number;
  windowDuration?: number;
  numFrequencies?: number;
}

export interface SweptDpoaeResultsInterface extends DpoaeResultsCommonInterface {
  NumSweeps?: number;
  DpLow?: DPOAEDataInterface;
  DpHigh?: DPOAEDataInterface;
  F1?: DPOAEDataInterface;
  F2?: DPOAEDataInterface;
  Raw?: {
    DpLow?: DPOAEDataInterface;
    DpHigh?: DPOAEDataInterface;
    F1?: DPOAEDataInterface;
    F2?: DPOAEDataInterface;
  };
}

export { DPOAEDataInterface } from '../../shared/dpoae/dpoae-common.interface';
