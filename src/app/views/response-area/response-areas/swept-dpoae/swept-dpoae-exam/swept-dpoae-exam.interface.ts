import { NormativeDataInterface } from "../../../../../interfaces/normative-data-interface";
import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface SweptDpoaeInterface extends CommonResponseAreaInterface {
  exportToCSV?: boolean;
  tabsintId?: string;
  outputCalibrationType?: string;
  outputChannel1?: string;
  outputChannel2?: string;
  inputChannel?: string;
  f2Start?: number;
  f2End?: number;
  ratio?: number;
  sweepDuration?: number;
  sweepType?: 'log' | 'linear';
  l1?: number;
  l2?:  number;
  minSweeps?: number;
  maxSweeps?: number;
  noiseFloorThreshold?: number;
  SNRThreshold?: number;
  windowDuration?: number;
  numFrequencies?: number;
  filename?: string;
  outputRawMeasurements?: boolean;
  showResults?: boolean;
  normativeDataPath?: string;
  normativeData?: NormativeDataInterface[];
}

export interface SweptDpoaeResultsInterface { 
  State: string; 
  PctComplete: number;
  NumSweeps?: number;
  DpLow?: DPOAEDataInterface,
  DpHigh?: DPOAEDataInterface,
  F1?: DPOAEDataInterface,
  F2?: DPOAEDataInterface,
  Raw?: {
    DpLow?: DPOAEDataInterface,
    DpHigh?: DPOAEDataInterface,
    F1?: DPOAEDataInterface,
    F2?: DPOAEDataInterface,
  }
}
  
export interface DPOAEDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor?: number[];
}
