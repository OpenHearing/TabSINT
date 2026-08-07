import { DpoaeCommonInterface, DpoaeResultsCommonInterface, DPOAEDataInterface } from '../../shared/dpoae/dpoae-common.interface';

export interface DpGramInterface extends DpoaeCommonInterface {
  f2: number[];
  // TODO: unconfirmed per-point averaging/repeat control - confirm name/default against firmware.
  numAverages?: number;
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

export { DPOAEDataInterface };
