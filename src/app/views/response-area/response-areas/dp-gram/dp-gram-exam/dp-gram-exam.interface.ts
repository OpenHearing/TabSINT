import { DpoaeCommonInterface, DpoaeResultsCommonInterface, DPOAEDataInterface } from '../../shared/dpoae/dpoae-common.interface';

export interface DpGramInterface extends DpoaeCommonInterface {
  f2: number[];
  windowDuration?: number;
  minTestAverages?: number;
  maxTestAverages?: number;
  ear?: 'left' | 'right';
}

export interface DpGramResultsInterface extends DpoaeResultsCommonInterface {
  NumPoints?: number;
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
